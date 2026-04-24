class GPOService {
  constructor() {
    this.dwordMap = {
      REG_NONE: 0,
      REG_SZ: 1,
      REG_DWORD: 4,
      REG_MULTI_SZ: 7
    };
  }

  validateGuidelines(selectedGuidelines) {
    if (!Array.isArray(selectedGuidelines) || selectedGuidelines.length === 0) {
      throw new Error('Please select at least one guideline');
    }

    const valid = selectedGuidelines.filter(
      (guideline) => guideline && Array.isArray(guideline.registry_info) && guideline.registry_info.length > 0
    );

    if (valid.length === 0) {
      throw new Error('No guidelines with registry information found');
    }

    return valid;
  }

  processRegistryPath(regPath, regCurrent) {
    const cleanPath = String(regPath || '').replace(':', '\\');
    const arr = cleanPath.split('\\');

    if (arr[1] === '[USER SID]') {
      arr[0] = 'USER';
      arr[1] = regCurrent.user || 'CurrentUser';
    } else {
      arr[0] = 'MACHINE';
      if (arr[1]) {
        arr[1] = arr[1].charAt(0).toUpperCase() + arr[1].slice(1).toLowerCase();
      }
    }

    return arr.join('\\');
  }

  formatRegistryValue(regCurrent) {
    return regCurrent.dword_value === 'REG_SZ' ? `"${regCurrent.value}"` : regCurrent.value;
  }

  generateGPOTemplate(selectedGuidelines) {
    const valid = this.validateGuidelines(selectedGuidelines);
    const gpoTemplate = [];

    valid.forEach((guideline) => {
      const regInfo = guideline.registry_info;
      regInfo.forEach((regCurrent) => {
        const processedPath = this.processRegistryPath(regCurrent.path, regCurrent);
        const formattedValue = this.formatRegistryValue(regCurrent);

        gpoTemplate.push({
          path: processedPath,
          value: formattedValue,
          dword_value: this.dwordMap[regCurrent.dword_value] || 0
        });
      });
    });

    return gpoTemplate;
  }

  createINFContent(gpoTemplate) {
    let infContent = [
      '[Unicode]',
      'Unicode=yes',
      '[Version]',
      'signature="$CHICAGO$"',
      'Revision=1',
      '',
      '[Registry Values]'
    ].join('\n') + '\n';

    gpoTemplate.forEach((item) => {
      infContent += `${item.path}=${item.dword_value},${item.value}\n`;
    });

    return infContent;
  }

  getDeploymentStats(selectedGuidelines) {
    const valid = this.validateGuidelines(selectedGuidelines);
    let totalEntries = 0;

    valid.forEach((g) => {
      totalEntries += g.registry_info.length;
    });

    return {
      totalGuidelines: selectedGuidelines.length,
      guidelinesWithRegistry: valid.length,
      guidelinesWithoutRegistry: selectedGuidelines.length - valid.length,
      totalRegistryEntries: totalEntries,
      deployable: valid.length > 0
    };
  }
}

module.exports = GPOService;
