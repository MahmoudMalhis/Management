module.exports = {
  createAccomplishment: require("./create"),
  getAccomplishments: require("./list"),
  getAccomplishment: require("./getOne"),
  addComment: require("./addComment"),
  addEmployeeReply: require("./addReply"),
  reviewAccomplishment: require("./review"),
  modifyAccomplishment: require("./modify"),
  startAccomplishment: require("./start"),
  exportAccomplishments: require("./exportExcel"),
};
