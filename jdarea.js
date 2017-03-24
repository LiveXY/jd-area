const fs = require("fs");
const request = require('request');
const areaFile = __dirname + "/areas.json";
const allFile = __dirname + "/all.json";
let areas = [];

const getProvinces = () => {
	return new Promise((resolve, reject) => {
		request('http://p.m.jd.com/norder/selectProvince.action', (e, r, b) => {
			const json = JSON.parse(b).addressList;
		  	for (let i = 0, len = json.length; i < len; i++) json[i].pid = 0;
		  	console.log('-- getProvinces:', 0, json.length, '行');
		  	resolve(json);
		});
	});
}
const getCitys = pid => {
	return new Promise((resolve, reject) => {
		request('http://p.m.jd.com/norder/selectCity.action?idProvince=' + pid, (e, r, b) => {
			const json = JSON.parse(b).addressList;
		  	for (let i = 0, len = json.length; i < len; i++) json[i].pid = pid;
		  	console.log('-- getCitys:', pid, json.length, '行');
		  	resolve(json);
		});
	});
}
const getAreas = pid => {
	return new Promise((resolve, reject) => {
		request('http://p.m.jd.com/norder/selectArea.action?idCity=' + pid, (e, r, b) => {
			const json = JSON.parse(b).addressList;
		  	for (let i = 0, len = json.length; i < len; i++) json[i].pid = pid;
		  	console.log('-- getAreas:', pid, json.length, '行');
		  	resolve(json);
		});
	});
}
const getTowns = pid => {
	return new Promise((resolve, reject) => {
		request('http://p.m.jd.com/norder/selectTown.action?idArea=' + pid, (e, r, b) => {
			const json = JSON.parse(b).addressList;
		  	for (let i = 0, len = json.length; i < len; i++) json[i].pid = pid;
		  	console.log('-- getTowns:', pid, json.length, '行');
		  	resolve(json);
		});
	});
}

const processProvince = list => {
	areas = areas.concat(list);
	let citys = [], index = 0, listlen = list.length;

	return new Promise((resolve, reject) => {
		for(let i = 0, len = list.length; i < len; i++) {
			getCitys(list[i].id).then(list => {
				areas = areas.concat(list);
				citys = citys.concat(list);
				index++;
				if (index == listlen) resolve(citys);
			});
		}
	});
}
const processCity = list => {
	let citys = [], index = 0, listlen = list.length;

	return new Promise((resolve, reject) => {
		for(let i = 0, len = list.length; i < len; i++) {
			getAreas(list[i].id).then(list => {
				areas = areas.concat(list);
				citys = citys.concat(list);
				index++;
				if (index == listlen) resolve(citys);
			});
		}
	});
}
const processArea = list => {
	return new Promise((resolve, reject) => {
		let citys = [], index = 0, listlen = list.length;
		let next = i => {
			getTowns(list[i].id).then(list => {
				areas = areas.concat(list);
				citys = citys.concat(list);
				index++;
				if (index == listlen) resolve(citys); else next(i+1);
			});
		}
		next(0);
	});
}
const done = () => {
	return new Promise((resolve, reject) => {
		const data2 = JSON.stringify(areas);
		fs.writeFile(allFile, data2, 'utf8', (err, result) => {
			console.log('-- 保存文件成功！', areas.length, '行');
			resolve(areas);
		});
	});
}
const readAllArea = () => {
	if (!fs.existsSync(allFile)) return Promise.resolve(null);

	return new Promise((resolve, reject) => {
		fs.readFile(allFile, 'utf8', (err, result) => {
			result = result && result.indexOf('[') == 0 ? result : null;
			areas = result ? JSON.parse(result) : [];
			resolve(areas);
			console.log('-- 读文件成功！', areas.length, '行');
		});
	});
};
const processToSQL = list => {
	for (let i = 0, len = areas.length; i < len; i++) {
		console.log("insert into jdarea(id,pid,name) values(" + areas[i].id + ',' + areas[i].pid + ",'" + areas[i].name + "');");
	}
	console.log('-- SQL', areas.length, '行');
};
const process = list => {
	if (!list) getProvinces().then(processProvince).then(processCity).then(processArea).then(done).then(processToSQL);
	else processToSQL(list);
}

readAllArea().then(process);





