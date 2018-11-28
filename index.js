const Cheerio = require('cheerio');
const Axios = require('axios');
const MongoClient = require('mongodb').MongoClient;
const Assert = require('assert');
const DbUrl = 'mongodb://localhost:27017';
const DbName = "appStoreStatus";
const CollectionsName = "storeInfos";
const StoreStatus = require('./storeStatus');

const Channels = {
  "豌豆荚": "https://www.wandoujia.com/apps/com.zgf.huoshan",
  "百度手机助手": "https://shouji.baidu.com/software/25128270.html",
  "360手机助手": "http://zhushou.360.cn/detail/index/soft_id/3968893",
  "应用宝": "https://sj.qq.com/myapp/detail.htm?apkName=com.zgf.huoshan",
  "小米": "http://app.mi.com/details?id=com.zgf.huoshan",
};

let date = new Date();
let collection;
checkStoreStatus()
    .then(data => console.log("成功了！！！ ", data))
    .catch(err => console.log("失败了！！！ ", err));
async function checkStoreStatus() {
  let client  = await new MongoClient(DbUrl).connect();
  collection = client.db(DbName).collection(CollectionsName);
  for(let channel in Channels) {
    switch (channel) {
      case "豌豆荚":
        await parseWanDouJia();
        break;
      case "百度手机助手":
        await parseBaiduShouJiZhuShou();
        break;
      case "360手机助手":
        await parse360ShouJiZhuShou();
        break;
      case "应用宝":
        await parseYingYongBao();
        break;
      case "小米":
        await parseXiaoMi();
        break;
    }
  }
  await client.close(false);
}
function parseWanDouJia() {
  let channel = "豌豆荚";
  return Axios.get(Channels[channel])
      .then(data => {
        let $ = Cheerio.load(data.data);
        let infoList = $("dl.infos-list");
        let size = $("dt:contains(大小)+dd", infoList).text().replace(/\s+/g,"");
        let version = $("dt:contains(版本)+dd", infoList).text().replace(/\s+/g,"");
        let author = $("dt:contains(开发者)+dd", infoList).text().replace(/\s+/g,"");

        let numList = $("div.num-list");
        let updateDate = $("span.verified-info>span.update-time", numList).text().replace(/\s+/g,"").split(":")[1];
        let downloadCount = $("div.app-info-data>span.install>i", numList).text();
        let commentCount = $("div.app-info-data>a>i", numList).text();
        //<i class="avg-score-current" style="width: 0%"></i>
        let rate = $("span.avg-score-star>i", numList).attr("style").replace(/\s+/g,"").split(":")[1].replace("%", "") * 5 / 100;
        let result = {channel, size, version, author, updateDate, downloadCount, commentCount, rate, date};
        console.log("豌豆荚：", result);
        return collection.insertOne(result);
      })
      .catch(e => console.log(channel, e));
}

function parseBaiduShouJiZhuShou() {
  let channel = "百度手机助手";
  return Axios.get(Channels[channel])
      .then(data => {
        let $ = Cheerio.load(data.data);
        let detail = $("div.detail").eq(0);
        let size = $("span.size", detail).text().replace(/\s+/g,"").split(":")[1];
        let version = $("span.version", detail).text().replace(/\s+/g,"").split(":")[1];
        let downloadCount = $("span.download-num", detail).text().replace(/\s+/g,"").split(":")[1];

        //<span class="star-percent" style="width:50%"></span>
        let rate = $("span.star-percent").eq(0).attr("style").split(":")[1].replace("%", "") * 5 / 100;
        let result = {channel, size, version, downloadCount, rate, date};
        console.log("百度：", result);
        return collection.insertOne(result);
      })
      .catch(e => console.log(channel, e));
}

function parse360ShouJiZhuShou() {
  let channel = "360手机助手";
  return Axios.get(Channels[channel])
      .then(data => {
        let $ = Cheerio.load(data.data);
        let detail = $("dd>div.pf");
        //<span class="s-3">下载：33万次</span>
        let downloadCount = $("span.s-3", detail).eq(0).text().replace(/\s+/g,"").split("：")[1].replace("次", "");
        //<span class="s-3">14.45M</span>
        let size = $("span.s-3", detail).eq(1).text().replace(/\s+/g,"");
        //TODO 爬取的评论次数有问题，始终为0
        let commentCount = $("span.s-2>a>span", detail).text();
        //<span class="s-1 js-votepanel">4.1<em>分</em></span>
        let rate = $("span.js-votepanel", detail).text().replace("分", "");

        let baseInfo = $("div.base-info>table>tbody>tr");
        let author = $("td", baseInfo[0]).eq(0).contents().eq(1).text();
        let updateTime = $("td", baseInfo[0]).eq(1).contents().eq(1).text();
        let version = $("td", baseInfo[1]).eq(0).contents().eq(1).text();
        let result = {channel, rate, size, version, downloadCount, commentCount, author, updateTime, date};
        console.log("360手机助手", result);
        return collection.insertOne(result);
      })
      .catch(e => console.log(channel, e));
}

function parseYingYongBao() {
  let channel = "应用宝";
  return Axios.get(Channels[channel])
      .then(data => {
        let $ = Cheerio.load(data.data);
        let detail = $("div.det-ins-data");
        let rate = $("div.det-star-box>div.com-blue-star-num", detail).text().replace("分", "");
        let downloadCount = $("div.det-insnum-line>div.det-ins-num", detail).text().replace("下载", "");
        let size = $("div.det-insnum-line>div.det-size", detail).text();
        let category = $("div.det-insnum-line>div.det-type-box>a.det-type-link", detail).text();

        let detail2 = $("div.det-othinfo-container");
        let version = $("div.det-othinfo-data", detail2).eq(0).text().replace("V", "");
        //TODO 更新时间爬取失败
        let updateTime = $("div#J_ApkPublishTime", detail2).text();
        let author = $("div.det-othinfo-data", detail2).eq(2).text();
        let result = {channel, rate, size, version, downloadCount, category, author, updateTime, date};
        console.log("应用宝：", result);
        return collection.insertOne(result);
      })
      .catch(e => console.log(channel, e));
}

function parseXiaoMi() {
  let channel = "小米";
  return Axios.get(Channels[channel])
      .then(data => {
        let $ = Cheerio.load(data.data);

        let intro = $("div.intro-titles");
        let author = $("p", intro).eq(0).text();
        let category = $("p.special-font.action", intro).contents().eq(1).text();
        let rate = $("div.star1-empty>div", intro).attr("class").split("-")[2]*5/10;
        let commentCount = $("span.app-intro-comment", intro).text().substr(2, 3);


        let detail = $("div.details.preventDefault>ul>li");
        let size = detail.eq(1).text().replace(" ", "");
        let version = detail.eq(3).text();
        let updateTime = detail.eq(5).text();
        let result = {channel, rate, size, version, commentCount, category, author, updateTime, date};
        console.log("小米：", result);
        return collection.insertOne(result);
      })
      .catch(e => console.log(channel, e));
}