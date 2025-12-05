// Cloudflare Worker 核心代码：汇率API代理 + KV数据存储
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. 处理Fixer汇率API代理
    if (path.startsWith('/api/fixer')) {
      return handleFixerProxy(request, url, env);
    }

    // 2. 处理KV数据存储
    if (path.startsWith('/api/kv')) {
      // 确保PROFIT_CALC_KV绑定存在
      if (!env.PROFIT_CALC_KV) {
        return new Response(JSON.stringify({
          success: false,
          message: 'KV namespace未正确配置'
        }), { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }, 
          status: 500 
        });
      }
      return handleKVOperations(request, url, env.PROFIT_CALC_KV, env.API_KEY);
    }

    // 3. 处理分享数据
    if (path.startsWith('/api/share')) {
      return handleShareOperations(request, url, env.PROFIT_CALC_KV);
    }

    // 4. 获取存储在KV中的汇率数据
    if (path === '/api/rate') {
      return handleRateRequest(env.PROFIT_CALC_KV);
    }

    // 5. 手动触发汇率更新（仅用于测试）
    if (path === '/api/update-rate') {
      return handleManualRateUpdate(env);
    }

    // 6. 404
    return new Response("Not Found", { status: 404 });
  },

  // 定时任务：每天更新汇率数据
  async scheduled(controller, env, ctx) {
    await updateExchangeRate(env, true);
  }
};

/**
 * Fixer API反向代理（隐藏Token）
 */
async function handleFixerProxy(request, url, env) {
  const FIXER_API_KEY = env.FIXER_API_KEY || "vrbrAqx7SGXVgjF1lPufV6G86hzqZ0PE"; // 替换为你的API Key
  const symbols = url.searchParams.get('symbols') || 'CNY';
  const base = url.searchParams.get('base') || 'USD';
  const targetUrl = `https://api.apilayer.com/fixer/latest?symbols=${symbols}&base=${base}`;

  // 构建代理请求
  const proxyRequest = new Request(targetUrl, {
    method: 'GET',
    headers: {
      'apikey': FIXER_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  // 发送请求
  const response = await fetch(proxyRequest);
  const data = await response.json();
  
  // 如果获取成功，同时保存到KV
  if (data.success && data.rates?.CNY) {
    try {
      // 存储到KV
      const rateData = {
        rate: data.rates.CNY,
        timestamp: data.timestamp,
        date: data.date,
        source: 'fixer-proxy'
      };
      
      await env.PROFIT_CALC_KV.put('exchange_rate_usd_cny', JSON.stringify(rateData), {
        metadata: { updated: Date.now() }
      });
      
      console.log(`通过代理获取的汇率数据已保存到KV: ${data.rates.CNY}`);
    } catch (err) {
      console.error('保存汇率数据到KV时出错:', err);
    }
  }
  
  // 返回响应
  const modifiedRes = new Response(JSON.stringify(data), response);
  modifiedRes.headers.set('Access-Control-Allow-Origin', '*');
  modifiedRes.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  return modifiedRes;
}

/**
 * KV数据操作（增删改查）
 */
async function handleKVOperations(request, url, kv, expectedApiKey) {
  const path = url.pathname;
  const method = request.method;
  const userId = url.searchParams.get('userId') || 'default';
  const kvKey = `user_${userId}`;

  // API密钥验证
  const apiKey = request.headers.get('X-API-Key');
  
  // 对于非GET请求，验证API密钥
  if (method !== 'GET' && method !== 'OPTIONS') {
    if (!apiKey || apiKey !== expectedApiKey) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized: Invalid API Key'
      }), { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-API-Key'
        }, 
        status: 401 
      });
    }
  }

  // 添加CORS头部以支持跨域请求
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Content-Type': 'application/json'
  };

  // 处理预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. 获取KV数据
  if (method === 'GET' && path === '/api/kv/data') {
    try {
      const data = await kv.get(kvKey);
      return new Response(JSON.stringify({
        success: true,
        data: data ? JSON.parse(data) : []
      }), { headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        message: err.message
      }), { headers: corsHeaders, status: 500 });
    }
  }

  // 2. 保存KV数据
  if (method === 'POST' && path === '/api/kv/data') {
    try {
      const body = await request.json();
      await kv.put(kvKey, JSON.stringify(body));
      return new Response(JSON.stringify({
        success: true,
        message: '云端数据保存成功'
      }), { headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        message: err.message
      }), { headers: corsHeaders, status: 500 });
    }
  }

  // 3. 删除KV数据
  if (method === 'DELETE' && path === '/api/kv/data') {
    try {
      await kv.delete(kvKey);
      return new Response(JSON.stringify({
        success: true,
        message: '云端数据删除成功'
      }), { headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        message: err.message
      }), { headers: corsHeaders, status: 500 });
    }
  }

  // 无效操作
  return new Response(JSON.stringify({
    success: false,
    message: '无效的KV操作'
  }), { headers: corsHeaders, status: 400 });
}

/**
 * 处理汇率请求 - 从KV获取存储的汇率数据
 */
async function handleRateRequest(kv) {
  try {
    const rateData = await kv.get('exchange_rate_usd_cny');
    if (rateData) {
      const parsedData = JSON.parse(rateData);
      return new Response(JSON.stringify({
        success: true,
        rate: parsedData.rate,
        timestamp: parsedData.timestamp,
        source: 'kv'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: '暂无汇率数据'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 404
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: err.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      status: 500
    });
  }
}

/**
 * 手动触发汇率更新（仅用于测试）
 */
async function handleManualRateUpdate(env) {
  const result = await updateExchangeRate(env, false);
  
  if (result.success) {
    return new Response(JSON.stringify({
      success: true,
      message: `汇率数据更新成功: ${result.rate}`,
      rate: result.rate,
      timestamp: result.timestamp
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } else {
    return new Response(JSON.stringify({
      success: false,
      message: `汇率数据更新失败: ${result.error}`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      status: 500
    });
  }
}

/**
 * 更新汇率数据
 * @param {Object} env - 环境变量
 * @param {boolean} isScheduled - 是否为定时任务调用
 */
async function updateExchangeRate(env, isScheduled = true) {
  try {
    // 从Fixer API获取汇率数据
    const FIXER_API_KEY = env.FIXER_API_KEY || "vrbrAqx7SGXVgjF1lPufV6G86hzqZ0PE";
    const targetUrl = `https://api.apilayer.com/fixer/latest?symbols=CNY&base=USD`;
    
    const proxyRequest = new Request(targetUrl, {
      method: 'GET',
      headers: {
        'apikey': FIXER_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const response = await fetch(proxyRequest);
    const data = await response.json();

    if (data.success && data.rates?.CNY) {
      // 存储到KV
      const rateData = {
        rate: data.rates.CNY,
        timestamp: data.timestamp,
        date: data.date,
        source: isScheduled ? 'scheduled' : 'manual'
      };
      
      await env.PROFIT_CALC_KV.put('exchange_rate_usd_cny', JSON.stringify(rateData), {
        metadata: { updated: Date.now() }
      });
      
      const source = isScheduled ? '定时任务' : '手动触发';
      console.log(`${source}汇率数据更新成功: ${data.rates.CNY} at ${new Date(data.timestamp * 1000).toISOString()}`);
      return { success: true, rate: data.rates.CNY, timestamp: data.timestamp };
    } else {
      console.error('获取汇率数据失败:', data);
      return { success: false, error: '获取汇率数据失败' };
    }
  } catch (err) {
    console.error('更新汇率数据时发生错误:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 分享数据操作
 */
async function handleShareOperations(request, url, kv) {
  const path = url.pathname;
  const method = request.method;
  const shareId = url.searchParams.get('id');

  // 添加CORS头部以支持跨域请求
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // 处理预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. 获取分享数据
  if (method === 'GET' && path === '/api/share/data' && shareId) {
    try {
      const kvKey = `share_${shareId}`;
      const data = await kv.get(kvKey);
      if (data) {
        return new Response(JSON.stringify({
          success: true,
          data: JSON.parse(data)
        }), { headers: corsHeaders });
      } else {
        return new Response(JSON.stringify({
          success: false,
          message: '分享数据不存在或已过期'
        }), { headers: corsHeaders, status: 404 });
      }
    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        message: err.message
      }), { headers: corsHeaders, status: 500 });
    }
  }

  // 2. 创建分享数据
  if (method === 'POST' && path === '/api/share/data') {
    try {
      const body = await request.json();
      // 生成唯一的分享ID
      const shareId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const kvKey = `share_${shareId}`;
      
      // 保存分享数据，设置过期时间（例如7天）
      await kv.put(kvKey, JSON.stringify(body), { expirationTtl: 604800 });
      
      return new Response(JSON.stringify({
        success: true,
        shareId: shareId,
        message: '分享链接创建成功'
      }), { headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        message: err.message
      }), { headers: corsHeaders, status: 500 });
    }
  }

  // 无效操作
  return new Response(JSON.stringify({
    success: false,
    message: '无效的分享操作'
  }), { headers: corsHeaders, status: 400 });
}
