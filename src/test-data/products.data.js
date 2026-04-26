module.exports = {
  validId: 1,
  anotherValidId: 2,
  nonExistentId: 999999,
  invalidIdString: 'abc',

  filters: {
    byCategory: { category: 'electronics' },
    paginated: { page: 1, limit: 5 },
    page2: { page: 2, limit: 3 },
    combined: { category: 'electronics', page: 1, limit: 10 },
    unknownCategory: { category: 'nonexistent_category_xyz' },
  },
};
