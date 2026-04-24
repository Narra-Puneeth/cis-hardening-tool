class GPODataManager {
  constructor() {
    this.cache = new Map();
  }

  async loadPolicyData(filePath, fsModule) {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath);
    }

    const fileContent = await fsModule.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    const processedData = this.isNestedStructure(data) ? this.flattenNestedData(data) : data;

    this.cache.set(filePath, processedData);
    return processedData;
  }

  isNestedStructure(data) {
    if (!data || typeof data !== 'object') return false;
    const keys = Object.keys(data);
    if (keys.length === 0) return false;
    const first = data[keys[0]];
    return !!(first && first.subcategories !== undefined);
  }

  flattenNestedData(data) {
    const flattened = {};

    Object.values(data).forEach((category) => {
      if (!category || !category.subcategories) return;

      const categoryTitle = category.title || 'Unknown Category';

      Object.values(category.subcategories).forEach((subcategory) => {
        const subcategoryTitle = subcategory.title || 'Unknown Subcategory';
        const guidelines = subcategory.guidelines || [];

        guidelines.forEach((guideline) => {
          if (!guideline || !guideline.number) return;

          flattened[guideline.number] = {
            ...guideline,
            registry_info: guideline.registry_info || [],
            path: [categoryTitle, subcategoryTitle],
            category: categoryTitle,
            subcategory: subcategoryTitle
          };
        });
      });
    });

    return flattened;
  }

  getDeployablePolicies(data) {
    return Object.entries(data || {})
      .filter(([, policy]) => Array.isArray(policy.registry_info) && policy.registry_info.length > 0)
      .reduce((acc, [id, policy]) => {
        acc[id] = policy;
        return acc;
      }, {});
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = GPODataManager;
