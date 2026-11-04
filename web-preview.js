// GitHub Pages 전용: 공유 서버 없이 브라우저에 미리보기 데이터를 저장합니다.
(() => {
    const originalFetch = window.fetch.bind(window);
    const storageKey = 'hongboya-preview:' + new URL('.', location.href).pathname;
    const tables = new Set(['poster_settings', 'site_config', 'chatbot_data',
        'consultation_requests', 'franchise_store_rows', 'banners', 'events', 'member_registrations']);
    const reply = (data, status = 200) => new Response(JSON.stringify(data), {
        status, headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
    window.fetch = async (input, options = {}) => {
        const url = new URL(input instanceof Request ? input.url : input, location.href);
        const base = new URL('.', location.href).pathname + 'tables/';
        if (url.origin !== location.origin || !url.pathname.startsWith(base)) {
            return originalFetch(input, options);
        }
        const [table, id] = url.pathname.slice(base.length).split('/');
        if (!tables.has(table)) return reply({ error: 'Unknown table' }, 404);
        try {
            const db = JSON.parse(localStorage.getItem(storageKey) || '{}');
            const rows = db[table] || [];
            const method = (options.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
            const index = rows.findIndex(row => row.id === id);
            if (method === 'GET') {
                if (id) return index < 0 ? reply({ error: 'Record not found' }, 404) : reply(rows[index]);
                const page = Number(url.searchParams.get('page') || 1);
                const limit = Number(url.searchParams.get('limit') || 100);
                if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
                    return reply({ error: 'Invalid page or limit' }, 400);
                }
                const search = (url.searchParams.get('search') || '').toLowerCase();
                let result = rows.filter(row => !search || Object.values(row).some(v => String(v).toLowerCase().includes(search)));
                const sort = url.searchParams.get('sort');
                if (sort) {
                    const field = sort.replace(/^-/, '');
                    result.sort((a, b) => {
                        const av = a[field] ?? '', bv = b[field] ?? '';
                        const cmp = typeof av === 'number' && typeof bv === 'number'
                            ? av - bv : String(av).localeCompare(String(bv));
                        return sort.startsWith('-') ? -cmp : cmp;
                    });
                }
                return reply({ data: result.slice((page - 1) * limit, page * limit),
                    total: result.length, page, limit, total_pages: Math.ceil(result.length / limit) });
            }
            let result;
            if (method === 'DELETE' && id) {
                if (index < 0) return reply({ error: 'Record not found' }, 404);
                rows.splice(index, 1);
                result = { success: true, id };
            } else if ((method === 'POST' && !id) || (['PATCH', 'PUT'].includes(method) && id)) {
                if (id && index < 0) return reply({ error: 'Record not found' }, 404);
                const text = options.body ?? (input instanceof Request ? await input.clone().text() : '{}');
                const body = JSON.parse(text);
                if (!body || Array.isArray(body) || typeof body !== 'object') return reply({ error: 'Invalid body' }, 400);
                const now = new Date().toISOString();
                result = { ...(method === 'PATCH' ? rows[index] : {}), ...body,
                    id: id || crypto.randomUUID(), created_at: id ? rows[index].created_at : now, updated_at: now };
                if (id) rows[index] = result;
                else rows.push(result);
            } else return reply({ error: 'Method not allowed' }, 405);
            db[table] = rows;
            localStorage.setItem(storageKey, JSON.stringify(db));
            return reply(result, method === 'POST' ? 201 : 200);
        } catch (error) {
            return reply({ error: '미리보기 저장 실패: ' + error.message }, 400);
        }
    };
    document.addEventListener('DOMContentLoaded', () => {
        const notice = document.createElement('div');
        notice.textContent = '공유 미리보기 · 등록 내용은 이 브라우저에만 저장되며 다른 방문자와 공유되지 않습니다.';
        notice.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;padding:7px 12px;background:#172554;color:white;text-align:center;font:12px/1.5 sans-serif;pointer-events:none';
        document.body.appendChild(notice);
    });
})();
