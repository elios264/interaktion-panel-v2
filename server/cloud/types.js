module.exports = {
  role: Object.freeze({ admin: 'Admin', client: 'Client' }),
  mobileView: Object.freeze({ chess: 'chess', full: 'full', list: 'list' }),
  contentType: Object.freeze({ event: 'event', content: 'content' }),
  visibility: Object.freeze({ none: 'Admin', public: '*', members: 'Client' }),
  authMode: Object.freeze({ private: 'private', mixed: 'mixed', public: 'public' }),
};
