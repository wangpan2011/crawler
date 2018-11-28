exports = function StoreStatus(version, updateTime, author, size, rate, downloadCount, commentCount, category) {
  if(version) {
    this.version = version;
  }
  if(updateTime) {
    this.updateTime = updateTime;
  }
  if(author) {
    this.author = author;
  }
  if(size) {
    this.size = size;
  }
  if(rate) {
    this.rate = rate;
  }
  if(downloadCount) {
    this.downloadCount = downloadCount;
  }
  if(commentCount) {
    this.commentCount = commentCount;
  }
  if(category) {
    this.category = category;
  }
};