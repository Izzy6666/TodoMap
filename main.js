// LeanCloud云端同步任务地图专属逻辑
const APP_ID = 'Tcyd6Q4OHvWx8ojkoovSIiO5-gzGzoHsz';
const APP_KEY = 'li9JXYeqUit4BNAUskWlRasW';
AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: "https://Tcyd6Q4O.api.lncldglobal.com" });

let chart = echarts.init(document.getElementById('main'));
echarts.registerMap('china', chinaJson);

let taskData = {}; // { city: {text, status, date, objectId} }
let currentCity = '';

async function loadTasks() {
    const query = new AV.Query('CityTask');
    query.limit(1000);
    const results = await query.find();
    taskData = {};
    results.forEach(obj => {
        const city = obj.get('city');
        taskData[city] = {
            text: obj.get('text') || '',
            status: obj.get('status') || '未完成',
            date: obj.get('date') || '',
            objectId: obj.id
        };
    });
    renderMap();
}
function renderMap() {
    const data = Object.keys(taskData).map(city => ({
        name: city,
        value: (taskData[city]?.status === '已完成') ? 2 : 1
    }));
    chart.setOption({
        title: { text: '小吉&小尹地图计划', left: 'center' },
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                const d = taskData[params.name];
                if (!d) return params.name + '<br/>暂无任务';
                return params.name + '<br/>'
                    + '任务：' + (d.text || '') + '<br/>'
                    + '状态：' + (d.status || '') + '<br/>'
                    + (d.date ? '完成时间：' + d.date : '');
            }
        },
        visualMap: {
            min: 1, max: 2,
            left: 20, top: '80%',
            show: false,
            inRange: { color: ['#ffecb3', '#87e8de'] }
        },
        series: [{
            type: 'map',
            map: 'china',
            roam: true,
            emphasis: { label: { show: true } },
            data: data
        }]
    });
}
chart.on('click', function(params){
    showTaskInput(params.name);
});
function showTaskInput(city) {
    currentCity = city;
    document.getElementById('cityTitle').textContent = `任务：${city}`;
    const d = taskData[city] || {};
    document.getElementById('newTaskInput').value = d.text || '';
    document.getElementById('statusInput').value = d.status || '未完成';
    document.getElementById('dateInput').value = d.date || '';
    renderTaskList(city);
    document.getElementById('taskBox').style.display = 'block';
}
async function saveTask() {
    const text = document.getElementById('newTaskInput').value.trim();
    const status = document.getElementById('statusInput').value;
    const date = document.getElementById('dateInput').value;
    if (!text) return alert('输入内容，如亲亲做饭饭');
    let d = taskData[currentCity];
    let obj;
    if (d && d.objectId) {
        obj = AV.Object.createWithoutData('CityTask', d.objectId);
        obj.set('text', text);
        obj.set('status', status);
        obj.set('date', date);
    } else {
        obj = new AV.Object('CityTask');
        obj.set('city', currentCity);
        obj.set('text', text);
        obj.set('status', status);
        obj.set('date', date);
    }
    await obj.save();
    await loadTasks();
    closeTaskInput();
}
function closeTaskInput() {
    document.getElementById('taskBox').style.display = 'none';
}
function renderTaskList(city) {
    const ul = document.getElementById('taskList');
    ul.innerHTML = '';
    const d = taskData[city];
    if (d) {
        let li = document.createElement('li');
        li.innerHTML = `${d.text} <span class="del-btn" onclick="delTask('${city}')">删除</span>`;
        ul.appendChild(li);
    }
}
async function delTask(city) {
    const d = taskData[city];
    if (d && d.objectId) {
        const obj = AV.Object.createWithoutData('CityTask', d.objectId);
        await obj.destroy();
    }
    await loadTasks();
    closeTaskInput();
}
function exportTasks() {
    const out = {};
    Object.keys(taskData).forEach(city => {
        out[city] = { ...taskData[city] };
        delete out[city].objectId;
    });
    const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'china_tasks.json';
    a.click();
}
window.onload = function() {
    loadTasks();
};
