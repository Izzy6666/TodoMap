// Daddy专属中国地图任务可视化 - 纯本地&纯前端
// 需要 echarts.min.js + china.js (var chinaJson=...)
let chart = echarts.init(document.getElementById('main'));
echarts.registerMap('china', chinaJson);

let taskData = JSON.parse(localStorage.getItem('chinaTasks') || '{}');
let currentCity = '';

function renderMap() {
    const data = Object.keys(taskData).map(city => ({
        name: city,
        value: (taskData[city]?.status === '已完成') ? 2 : 1
    }));
    chart.setOption({
        title: { text: '中国城市任务可视化地图', left: 'center' },
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
function saveTask() {
    const text = document.getElementById('newTaskInput').value.trim();
    const status = document.getElementById('statusInput').value;
    const date = document.getElementById('dateInput').value;
    if (!text) return alert('请输入任务内容！');
    taskData[currentCity] = { text, status, date };
    localStorage.setItem('chinaTasks', JSON.stringify(taskData));
    closeTaskInput();
    renderMap();
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
function delTask(city) {
    delete taskData[city];
    localStorage.setItem('chinaTasks', JSON.stringify(taskData));
    renderTaskList(city);
    renderMap();
}
function exportTasks() {
    const blob = new Blob([JSON.stringify(taskData, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'china_tasks.json';
    a.click();
}
window.onload = function() {
    renderMap();
};
