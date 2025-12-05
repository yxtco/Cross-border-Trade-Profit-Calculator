// 全局配置（部署后替换为你的Worker域名）
const CONFIG = {
    WORKER_URL: "https://profit-calc-proxy.chenhongjin857.workers.dev", // Worker的实际部署地址
    USER_ID: localStorage.getItem('userId') || generateUserId(),
    DEFAULT_RATE: 7.0639
};

// 部署说明：
// 1. 使用 wrangler deploy 部署 Worker
// 2. 将上面的 WORKER_URL 替换为实际的 Worker 地址
// 3. 将整个 pages 目录部署到静态网站托管服务

// 全局变量
let costChart = null;
let isWeightCalc = true;
let isPercentageCommission = true;
let savedLocalData = [];
let savedCloudData = [];
let selectedDataIndex = -1;
let activeLoadTab = 'local';

// 初始化用户ID
localStorage.setItem('userId', CONFIG.USER_ID);

// DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 检查URL中是否有分享参数
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    
    if (shareId) {
        // 如果有分享ID，加载分享数据
        loadShareData(shareId);
    } else {
        // 否则正常使用默认初始化
        calculateProfit();
        initCostChart();
        loadLocalData();
        loadCloudData().catch(err => console.log('云端KV未配置:', err));
    }
    setupEventListeners();
});

// 生成用户ID (使用UUID确保唯一性)
function generateUserId() {
    // 生成UUID v4
    return 'user_' + ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// 事件监听
function setupEventListeners() {
    // 核心计算
    document.getElementById('calculate-btn').addEventListener('click', calculateProfit);
    
    // 计算方式切换
    document.getElementById('weight-calc-btn').addEventListener('click', () => setActiveCalcMethod('weight'));
    document.getElementById('volume-calc-btn').addEventListener('click', () => setActiveCalcMethod('volume'));
    document.getElementById('percentage-commission-btn').addEventListener('click', () => setActiveCommissionMethod('percentage'));
    document.getElementById('fixed-commission-btn').addEventListener('click', () => setActiveCommissionMethod('fixed'));
    
    // 汇率刷新
    document.getElementById('auto-rate-btn').addEventListener('click', fetchExchangeRate);
    document.getElementById('refresh-rate').addEventListener('click', fetchExchangeRate);
    
    // 数据保存
    document.getElementById('save-data-btn').addEventListener('click', () => document.getElementById('save-modal').classList.remove('hidden'));
    document.getElementById('close-save-modal').addEventListener('click', () => document.getElementById('save-modal').classList.add('hidden'));
    document.getElementById('cancel-save').addEventListener('click', () => document.getElementById('save-modal').classList.add('hidden'));
    document.getElementById('confirm-save').addEventListener('click', saveData);
    
    // 数据分享
    document.getElementById('share-data-btn').addEventListener('click', shareData);
    
    // 数据加载标签
    document.getElementById('load-local-data-tab').addEventListener('click', () => setActiveLoadTab('local'));
    document.getElementById('load-cloud-data-tab').addEventListener('click', () => setActiveLoadTab('cloud'));
    document.getElementById('load-data-btn').addEventListener('click', () => {
        document.getElementById('load-modal').classList.remove('hidden');
        renderSavedDataList();
    });
    document.getElementById('close-load-modal').addEventListener('click', () => document.getElementById('load-modal').classList.add('hidden'));
    document.getElementById('cancel-load').addEventListener('click', () => document.getElementById('load-modal').classList.add('hidden'));
    document.getElementById('confirm-load').addEventListener('click', loadSelectedData);
    
    // 导出功能
    document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);
    document.getElementById('export-pdf-btn').addEventListener('click', exportToPdf);
    
    // 云端同步
    document.getElementById('sync-to-cloud').addEventListener('click', syncLocalToCloud);
    document.getElementById('sync-from-cloud').addEventListener('click', syncCloudToLocal);
    
    // 本地备份
    document.getElementById('export-local-backup').addEventListener('click', exportLocalBackup);
    document.getElementById('import-local-backup').addEventListener('click', importLocalBackup);
    
    // 通知关闭
    document.getElementById('close-notification').addEventListener('click', hideNotification);
    
    // 输入实时计算
    document.querySelectorAll('input[type="number"]').forEach(field => {
        field.addEventListener('input', calculateProfit);
    });
    
    // 数据选中
    document.getElementById('saved-data-list').addEventListener('click', function(e) {
        const row = e.target.closest('tr');
        if (row) {
            document.querySelectorAll('#saved-data-list tr').forEach(r => r.classList.remove('bg-blue-50'));
            row.classList.add('bg-blue-50');
            selectedDataIndex = Array.from(document.querySelectorAll('#saved-data-list tr')).indexOf(row);
        }
    });
}

// 设置加载标签
function setActiveLoadTab(tab) {
    activeLoadTab = tab;
    if (tab === 'local') {
        document.getElementById('load-local-data-tab').classList.replace('btn-secondary', 'btn-primary');
        document.getElementById('load-cloud-data-tab').classList.replace('btn-primary', 'btn-secondary');
    } else {
        document.getElementById('load-cloud-data-tab').classList.replace('btn-secondary', 'btn-primary');
        document.getElementById('load-local-data-tab').classList.replace('btn-primary', 'btn-secondary');
    }
    renderSavedDataList();
}

// 计算方式切换
function setActiveCalcMethod(method) {
    isWeightCalc = method === 'weight';
    if (isWeightCalc) {
        document.getElementById('weight-calc-btn').classList.replace('btn-secondary', 'btn-primary');
        document.getElementById('volume-calc-btn').classList.replace('btn-primary', 'btn-secondary');
        document.getElementById('weight-calc-form').classList.remove('hidden');
        document.getElementById('volume-calc-form').classList.add('hidden');
    } else {
        document.getElementById('volume-calc-btn').classList.replace('btn-secondary', 'btn-primary');
        document.getElementById('weight-calc-btn').classList.replace('btn-primary', 'btn-secondary');
        document.getElementById('volume-calc-form').classList.remove('hidden');
        document.getElementById('weight-calc-form').classList.add('hidden');
    }
    calculateProfit();
}

// 佣金方式切换
function setActiveCommissionMethod(method) {
    isPercentageCommission = method === 'percentage';
    if (isPercentageCommission) {
        document.getElementById('percentage-commission-btn').classList.replace('btn-secondary', 'btn-primary');
        document.getElementById('fixed-commission-btn').classList.replace('btn-primary', 'btn-secondary');
        document.getElementById('percentage-commission-form').classList.remove('hidden');
        document.getElementById('fixed-commission-form').classList.add('hidden');
    } else {
        document.getElementById('fixed-commission-btn').classList.replace('btn-secondary', 'btn-primary');
        document.getElementById('percentage-commission-btn').classList.replace('btn-primary', 'btn-secondary');
        document.getElementById('fixed-commission-form').classList.remove('hidden');
        document.getElementById('percentage-commission-form').classList.add('hidden');
    }
    calculateProfit();
}

// 获取实时汇率（Worker代理）
async function fetchExchangeRate() {
    showNotification('info', '正在获取汇率', '请稍候');
    try {
        const res = await fetch(`${CONFIG.WORKER_URL}/api/fixer?symbols=CNY&base=USD`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success && data.rates?.CNY) {
            const rate = data.rates.CNY.toFixed(4);
            document.getElementById('exchange-rate').value = rate;
            document.getElementById('current-rate').textContent = rate;
            document.getElementById('rate-update-time').textContent = formatDateTime(new Date(data.timestamp * 1000));
            calculateProfit();
            showNotification('success', '汇率更新成功', `当前汇率: ${rate}`);
        } else throw new Error('数据格式错误');
    } catch (err) {
        console.error('汇率获取失败:', err);
        document.getElementById('exchange-rate').value = CONFIG.DEFAULT_RATE;
        document.getElementById('current-rate').textContent = CONFIG.DEFAULT_RATE;
        document.getElementById('rate-update-time').textContent = `${formatDateTime(new Date())} (默认值)`;
        showNotification('error', '汇率获取失败', `使用默认汇率: ${CONFIG.DEFAULT_RATE}`);
    }
}

// 利润计算
function calculateProfit() {
    const rate = parseFloat(document.getElementById('exchange-rate').value) || 0;
    const productCNY = parseFloat(document.getElementById('product-cost').value) || 0;
    const sales = parseFloat(document.getElementById('sales-amount').value) || 0;
    
    // 头程运费（CNY转USD）
    let firstLegCNY = 0;
    let firstLegUSD = 0;
    if (isWeightCalc) {
        firstLegCNY = (parseFloat(document.getElementById('weight').value) || 0) * (parseFloat(document.getElementById('weight-price').value) || 0);
        firstLegUSD = firstLegCNY / rate;
        // 更新重量计算方式下的显示
        document.getElementById('first-leg-cost-usd-weight').textContent = firstLegUSD.toFixed(2) + ' USD';
    } else {
        firstLegCNY = (parseFloat(document.getElementById('volume').value) || 0) * (parseFloat(document.getElementById('volume-price').value) || 0);
        firstLegUSD = firstLegCNY / rate;
        // 更新体积计算方式下的显示
        document.getElementById('first-leg-cost-usd-volume').textContent = firstLegUSD.toFixed(2) + ' USD';
    }
    
    // 其他费用
    const lastLeg = parseFloat(document.getElementById('last-leg-fee').value) || 0;
    const warehouse = parseFloat(document.getElementById('warehouse-fee').value) || 0;
    const peak = parseFloat(document.getElementById('peak-season-fee').value) || 0;
    const loss = parseFloat(document.getElementById('loss-fee').value) || 0;
    
    // 佣金
    let commission = 0;
    if (isPercentageCommission) {
        commission = sales * (parseFloat(document.getElementById('commission-percentage').value) || 0) / 100;
    } else {
        commission = parseFloat(document.getElementById('commission-fixed').value) || 0;
    }
    
    // 验证
    if (rate <= 0 || productCNY <= 0 || sales <= 0) {
        showNotification('error', '输入错误', '汇率/成本/销售额需大于0');
        return;
    }
    
    // 核心计算
    const productUSD = productCNY / rate;
    const totalCost = productUSD + firstLegUSD + lastLeg + warehouse + peak + commission + loss;
    const profit = sales - totalCost;
    const profitCNY = profit * rate;
    const profitMargin = (profit / sales) * 100;
    
    // 更新UI
    document.getElementById('product-cost-usd').textContent = productUSD.toFixed(2) + ' USD';
    document.getElementById('used-rate').textContent = rate.toFixed(4);
    document.getElementById('total-cost').textContent = totalCost.toFixed(2) + ' USD';
    document.getElementById('profit-usd').textContent = profit.toFixed(2) + ' USD';
    document.getElementById('profit-cny').textContent = profitCNY.toFixed(2) + ' CNY';
    document.getElementById('profit-margin').textContent = profitMargin.toFixed(2) + '%';
    
    // 样式切换
    const profitUsdEl = document.getElementById('profit-usd');
    const marginEl = document.getElementById('profit-margin');
    if (profit >= 0) {
        profitUsdEl.parentElement.parentElement.classList.replace('bg-danger/10', 'bg-success/10');
        profitUsdEl.parentElement.parentElement.classList.replace('border-danger/20', 'border-success/20');
        profitUsdEl.classList.replace('text-danger', 'text-success');
        document.getElementById('profit-cny').classList.replace('text-danger', 'text-success');
        marginEl.parentElement.classList.replace('bg-danger/10', 'bg-success/10');
        marginEl.parentElement.classList.replace('border-danger/20', 'border-success/20');
        marginEl.classList.replace('text-danger', 'text-success');
    } else {
        profitUsdEl.parentElement.parentElement.classList.replace('bg-success/10', 'bg-danger/10');
        profitUsdEl.parentElement.parentElement.classList.replace('border-success/20', 'border-danger/20');
        profitUsdEl.classList.replace('text-success', 'text-danger');
        document.getElementById('profit-cny').classList.replace('text-success', 'text-danger');
        marginEl.parentElement.classList.replace('bg-success/10', 'bg-danger/10');
        marginEl.parentElement.classList.replace('border-success/20', 'border-danger/20');
        marginEl.classList.replace('text-success', 'text-danger');
    }
    
    // 更新图表
    updateCostChart({
        productCostUSD: productUSD, firstLegShipping: firstLegUSD, lastLegFee: lastLeg,
        warehouseFee: warehouse, peakSeasonFee: peak, platformFee: commission, lossFee: loss
    });
}

// 图表初始化
function initCostChart() {
    const ctx = document.getElementById('cost-chart').getContext('2d');
    costChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['产品成本', '头程运费', '尾程费用', '仓库费用', '旺季附加费', '平台佣金', '损耗费用'],
            datasets: [{
                data: [14.16, 2.27, 5.00, 2.00, 1.00, 4.50, 0.50],
                backgroundColor: ['#1a56db', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15, font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.raw.toFixed(2)} USD (${Math.round(ctx.raw/ctx.dataset.data.reduce((a,b)=>a+b,0)*100)}%)`
                    }
                }
            }
        }
    });
}

// 更新图表
function updateCostChart(costs) {
    if (!costChart) return;
    costChart.data.datasets[0].data = [
        costs.productCostUSD, costs.firstLegShipping, costs.lastLegFee,
        costs.warehouseFee, costs.peakSeasonFee, costs.platformFee, costs.lossFee
    ];
    costChart.update();
}

// 数据持久化 - 本地加载
function loadLocalData() {
    const data = localStorage.getItem('profitCalculatorLocalData');
    savedLocalData = data ? JSON.parse(data) : [];
}

// 数据持久化 - 云端加载
async function loadCloudData() {
    const res = await fetch(`${CONFIG.WORKER_URL}/api/kv/data?userId=${CONFIG.USER_ID}`, {
        method: 'GET',
        headers: {
            'X-API-Key': 'fixed_api_key_123456'
        }
    });
    const data = await res.json();
    if (data.success) savedCloudData = data.data || [];
    else throw new Error(data.message);
}

// 加载分享数据
async function loadShareData(shareId) {
    try {
        showNotification('info', '加载中', '正在加载分享数据...');
        
        const res = await fetch(`${CONFIG.WORKER_URL}/api/share/data?id=${shareId}`);
        const result = await res.json();
        
        if (result.success) {
            const data = result.data;
            
            // 填充表单数据
            document.getElementById('exchange-rate').value = data.exchangeRate;
            document.getElementById('product-cost').value = data.productCostCNY;
            document.getElementById('sales-amount').value = data.salesAmount;
            
            // 设置计算方式
            setActiveCalcMethod(data.isWeightCalc ? 'weight' : 'volume');
            document.getElementById('weight').value = data.weight;
            document.getElementById('weight-price').value = data.weightPrice;
            document.getElementById('volume').value = data.volume;
            document.getElementById('volume-price').value = data.volumePrice;
            
            // 设置其他费用
            document.getElementById('last-leg-fee').value = data.lastLegFee;
            document.getElementById('warehouse-fee').value = data.warehouseFee;
            document.getElementById('peak-season-fee').value = data.peakSeasonFee;
            
            // 设置佣金方式
            setActiveCommissionMethod(data.isPercentageCommission ? 'percentage' : 'fixed');
            document.getElementById('commission-percentage').value = data.commissionPercentage;
            document.getElementById('commission-fixed').value = data.commissionFixed;
            
            document.getElementById('loss-fee').value = data.lossFee;
            
            // 重新计算
            calculateProfit();
            initCostChart();
            
            showNotification('success', '加载成功', '分享数据已加载');
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        showNotification('error', '加载失败', err.message);
        // 如果加载分享数据失败，仍然进行默认初始化
        calculateProfit();
        initCostChart();
        loadLocalData();
        loadCloudData().catch(err => console.log('云端KV未配置:', err));
    }
}

// 保存数据
async function saveData() {
    const name = document.getElementById('save-name').value.trim();
    const desc = document.getElementById('save-description').value.trim();
    const syncCloud = document.getElementById('sync-to-cloud-on-save').checked;
    
    if (!name) {
        showNotification('error', '保存失败', '请输入数据名称');
        return;
    }
    
    // 构建数据
    const data = {
        id: Date.now().toString(),
        name,
        description: desc,
        timestamp: new Date(),
        storage: 'local',
        exchangeRate: parseFloat(document.getElementById('exchange-rate').value) || 0,
        productCostCNY: parseFloat(document.getElementById('product-cost').value) || 0,
        salesAmount: parseFloat(document.getElementById('sales-amount').value) || 0,
        isWeightCalc,
        weight: parseFloat(document.getElementById('weight').value) || 0,
        weightPrice: parseFloat(document.getElementById('weight-price').value) || 0,
        volume: parseFloat(document.getElementById('volume').value) || 0,
        volumePrice: parseFloat(document.getElementById('volume-price').value) || 0,
        lastLegFee: parseFloat(document.getElementById('last-leg-fee').value) || 0,
        warehouseFee: parseFloat(document.getElementById('warehouse-fee').value) || 0,
        peakSeasonFee: parseFloat(document.getElementById('peak-season-fee').value) || 0,
        isPercentageCommission,
        commissionPercentage: parseFloat(document.getElementById('commission-percentage').value) || 0,
        commissionFixed: parseFloat(document.getElementById('commission-fixed').value) || 0,
        lossFee: parseFloat(document.getElementById('loss-fee').value) || 0
    };
    
    // 保存到本地
    savedLocalData.push(data);
    localStorage.setItem('profitCalculatorLocalData', JSON.stringify(savedLocalData));
    
    // 同步到云端
    if (syncCloud) {
        try {
            data.storage = 'cloud';
            savedCloudData.push(data);
            const res = await fetch(`${CONFIG.WORKER_URL}/api/kv/data?userId=${CONFIG.USER_ID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'fixed_api_key_123456'
                },
                body: JSON.stringify(savedCloudData)
            });
            const resData = await res.json();
            if (!resData.success) throw new Error(resData.message);
            showNotification('success', '保存成功', '本地+云端均已保存');
        } catch (err) {
            showNotification('warning', '部分成功', '本地保存成功，云端失败: ' + err.message);
        }
    } else {
        showNotification('success', '保存成功', '已保存到本地');
    }
    
    // 关闭模态框
    document.getElementById('save-modal').classList.add('hidden');
    document.getElementById('save-name').value = '';
    document.getElementById('save-description').value = '';
}

// 分享数据
async function shareData() {
    // 收集当前表单数据
    const data = {
        exchangeRate: parseFloat(document.getElementById('exchange-rate').value) || 0,
        productCostCNY: parseFloat(document.getElementById('product-cost').value) || 0,
        salesAmount: parseFloat(document.getElementById('sales-amount').value) || 0,
        isWeightCalc,
        weight: parseFloat(document.getElementById('weight').value) || 0,
        weightPrice: parseFloat(document.getElementById('weight-price').value) || 0,
        volume: parseFloat(document.getElementById('volume').value) || 0,
        volumePrice: parseFloat(document.getElementById('volume-price').value) || 0,
        lastLegFee: parseFloat(document.getElementById('last-leg-fee').value) || 0,
        warehouseFee: parseFloat(document.getElementById('warehouse-fee').value) || 0,
        peakSeasonFee: parseFloat(document.getElementById('peak-season-fee').value) || 0,
        isPercentageCommission,
        commissionPercentage: parseFloat(document.getElementById('commission-percentage').value) || 0,
        commissionFixed: parseFloat(document.getElementById('commission-fixed').value) || 0,
        lossFee: parseFloat(document.getElementById('loss-fee').value) || 0
    };
    
    try {
        // 发送到服务器创建分享链接
        const res = await fetch(`${CONFIG.WORKER_URL}/api/share/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        if (result.success) {
            // 生成分享链接
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${result.shareId}`;
            
            // 复制到剪贴板
            await navigator.clipboard.writeText(shareUrl);
            
            // 显示成功通知
            showNotification('success', '分享成功', '分享链接已复制到剪贴板');
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        showNotification('error', '分享失败', err.message);
    }
}

// 渲染数据列表
function renderSavedDataList() {
    const list = document.getElementById('saved-data-list');
    const data = activeLoadTab === 'local' ? savedLocalData : savedCloudData;
    
    if (data.length === 0) {
        list.innerHTML = `<tr><td colspan="3" class="px-3 py-6 text-center text-sm text-gray-500">暂无${activeLoadTab === 'local' ? '本地' : '云端'}数据</td></tr>`;
        return;
    }
    
    list.innerHTML = '';
    data.forEach((item, idx) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 cursor-pointer';
        row.dataset.index = idx;
        row.innerHTML = `
            <td class="px-3 py-3 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${item.name}</div>
                <div class="text-xs text-gray-500 truncate max-w-[200px]">${item.description || '无描述'}</div>
            </td>
            <td class="px-3 py-3 whitespace-nowrap text-xs text-gray-500">${formatDateTime(new Date(item.timestamp))}</td>
            <td class="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                <span class="px-2 py-1 rounded-full ${item.storage === 'local' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}">
                    ${item.storage === 'local' ? '本地' : '云端'}
                </span>
            </td>
        `;
        list.appendChild(row);
    });
}

// 加载选中数据
function loadSelectedData() {
    if (selectedDataIndex === -1) {
        showNotification('error', '加载失败', '请选择数据');
        return;
    }
    
    const data = activeLoadTab === 'local' ? savedLocalData[selectedDataIndex] : savedCloudData[selectedDataIndex];
    
    // 填充表单
    document.getElementById('exchange-rate').value = data.exchangeRate;
    document.getElementById('current-rate').textContent = data.exchangeRate.toFixed(4);
    document.getElementById('product-cost').value = data.productCostCNY;
    document.getElementById('sales-amount').value = data.salesAmount;
    
    // 头程运费
    setActiveCalcMethod(data.isWeightCalc ? 'weight' : 'volume');
    document.getElementById('weight').value = data.weight;
    document.getElementById('weight-price').value = data.weightPrice;
    document.getElementById('volume').value = data.volume;
    document.getElementById('volume-price').value = data.volumePrice;
    
    // 其他费用
    document.getElementById('last-leg-fee').value = data.lastLegFee;
    document.getElementById('warehouse-fee').value = data.warehouseFee;
    document.getElementById('peak-season-fee').value = data.peakSeasonFee;
    
    // 佣金
    setActiveCommissionMethod(data.isPercentageCommission ? 'percentage' : 'fixed');
    document.getElementById('commission-percentage').value = data.commissionPercentage;
    document.getElementById('commission-fixed').value = data.commissionFixed;
    
    document.getElementById('loss-fee').value = data.lossFee;
    
    // 关闭模态框 + 重新计算
    document.getElementById('load-modal').classList.add('hidden');
    calculateProfit();
    showNotification('success', '加载成功', `已加载${activeLoadTab === 'local' ? '本地' : '云端'}数据: ${data.name}`);
}

// 本地备份导出
function exportLocalBackup() {
    const backup = { userId: CONFIG.USER_ID, data: savedLocalData, exportTime: new Date() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `利润计算器备份_${formatDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showNotification('success', '导出成功', '本地备份已生成');
}

// 本地备份导入
function importLocalBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.data && Array.isArray(data.data)) {
                    savedLocalData = data.data;
                    localStorage.setItem('profitCalculatorLocalData', JSON.stringify(savedLocalData));
                    renderSavedDataList();
                    showNotification('success', '导入成功', '本地数据已恢复');
                } else throw new Error('格式错误');
            } catch (err) {
                showNotification('error', '导入失败', '文件格式错误: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// 本地同步到云端
async function syncLocalToCloud() {
    showNotification('info', '同步中', '本地→云端');
    try {
        savedCloudData = [...savedCloudData, ...savedLocalData.filter(item => item.storage === 'local')];
        savedCloudData.forEach(item => item.storage = 'cloud');
        const res = await fetch(`${CONFIG.WORKER_URL}/api/kv/data?userId=${CONFIG.USER_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'fixed_api_key_123456'
            },
            body: JSON.stringify(savedCloudData)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        await loadCloudData();
        renderSavedDataList();
        showNotification('success', '同步成功', '本地数据已同步到云端');
    } catch (err) {
        showNotification('error', '同步失败', err.message);
    }
}

// 云端同步到本地
async function syncCloudToLocal() {
    showNotification('info', '同步中', '云端→本地');
    try {
        await loadCloudData();
        savedLocalData = [...savedLocalData, ...savedCloudData];
        localStorage.setItem('profitCalculatorLocalData', JSON.stringify(savedLocalData));
        renderSavedDataList();
        showNotification('success', '同步成功', '云端数据已同步到本地');
    } catch (err) {
        showNotification('error', '同步失败', err.message);
    }
}

// 导出Excel
function exportToExcel() {
    showNotification('info', '导出中', '生成Excel文件');
    setTimeout(() => {
        const table = `
            <table>
                <tr><th colspan="2">跨境贸易利润计算报告</th></tr>
                <tr><td>生成时间:</td><td>${formatDateTime(new Date())}</td></tr>
                <tr><td>汇率 (USD/CNY):</td><td>${document.getElementById('exchange-rate').value}</td></tr>
                <tr><td colspan="2">&nbsp;</td></tr>
                <tr><th>成本项目</th><th>金额 (USD)</th></tr>
                <tr><td>产品成本 (CNY):</td><td>${document.getElementById('product-cost').value}</td></tr>
                <tr><td>产品成本 (USD):</td><td>${document.getElementById('product-cost-usd').textContent}</td></tr>
                <tr><td>头程运费 (CNY):</td><td>${isWeightCalc ? 
                    (parseFloat(document.getElementById('weight').value)*parseFloat(document.getElementById('weight-price').value)) : 
                    (parseFloat(document.getElementById('volume').value)*parseFloat(document.getElementById('volume-price').value))
                .toFixed(2)}</td></tr>
                <tr><td>头程运费 (USD):</td><td>${(isWeightCalc ? 
                    (parseFloat(document.getElementById('weight').value)*parseFloat(document.getElementById('weight-price').value)) : 
                    (parseFloat(document.getElementById('volume').value)*parseFloat(document.getElementById('volume-price').value))
                /parseFloat(document.getElementById('exchange-rate').value)).toFixed(2)}</td></tr>
                <tr><td>尾程费用:</td><td>${document.getElementById('last-leg-fee').value}</td></tr>
                <tr><td>仓库费用:</td><td>${document.getElementById('warehouse-fee').value}</td></tr>
                <tr><td>旺季附加费:</td><td>${document.getElementById('peak-season-fee').value}</td></tr>
                <tr><td>平台佣金:</td><td>${isPercentageCommission ? 
                    (parseFloat(document.getElementById('sales-amount').value)*parseFloat(document.getElementById('commission-percentage').value)/100) : 
                    parseFloat(document.getElementById('commission-fixed').value)
                .toFixed(2)}</td></tr>
                <tr><td>损耗费用:</td><td>${document.getElementById('loss-fee').value}</td></tr>
                <tr><td>总成本:</td><td>${document.getElementById('total-cost').textContent}</td></tr>
                <tr><td>销售金额:</td><td>${document.getElementById('sales-amount').value} USD</td></tr>
                <tr><td>利润 (USD):</td><td>${document.getElementById('profit-usd').textContent}</td></tr>
                <tr><td>利润 (CNY):</td><td>${document.getElementById('profit-cny').textContent}</td></tr>
                <tr><td>利润率:</td><td>${document.getElementById('profit-margin').textContent}</td></tr>
            </table>
        `;
        const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `利润计算报告_${formatDate(new Date())}.xls`;
        a.click();
        URL.revokeObjectURL(a.href);
        showNotification('success', '导出成功', 'Excel文件已下载');
    }, 1000);
}

// 导出PDF（模拟）
function exportToPdf() {
    showNotification('info', '导出中', '生成PDF文件');
    setTimeout(() => {
        showNotification('success', '导出成功', 'PDF功能需结合jsPDF实现，此处为模拟');
    }, 1500);
}

// 显示通知
function showNotification(type, title, message) {
    const el = document.getElementById('notification');
    const icon = document.getElementById('notification-icon');
    const titleEl = document.getElementById('notification-title');
    const msgEl = document.getElementById('notification-message');
    
    // 图标/样式
    icon.className = '';
    if (type === 'success') {
        icon.classList.add('text-success');
        icon.innerHTML = '<i class="fa fa-check-circle text-xl"></i>';
    } else if (type === 'error') {
        icon.classList.add('text-danger');
        icon.innerHTML = '<i class="fa fa-exclamation-circle text-xl"></i>';
    } else if (type === 'warning') {
        icon.classList.add('text-warning');
        icon.innerHTML = '<i class="fa fa-exclamation-triangle text-xl"></i>';
    } else {
        icon.classList.add('text-info');
        icon.innerHTML = '<i class="fa fa-info-circle text-xl"></i>';
    }
    
    // 内容
    titleEl.textContent = title;
    msgEl.textContent = message;
    
    // 显示
    el.classList.remove('translate-y-10', 'opacity-0');
    clearTimeout(window.noticeTimer);
    window.noticeTimer = setTimeout(hideNotification, 5000);
}

// 隐藏通知
function hideNotification() {
    document.getElementById('notification').classList.add('translate-y-10', 'opacity-0');
}

// 格式化日期时间
function formatDateTime(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,0)}-${String(date.getDate()).padStart(2,0)} ${String(date.getHours()).padStart(2,0)}:${String(date.getMinutes()).padStart(2,0)}:${String(date.getSeconds()).padStart(2,0)}`;
}

// 格式化日期
function formatDate(date) {
    return `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,0)}${String(date.getDate()).padStart(2,0)}`;
}