// GitHub Pages & 로컬 공용: 초기 직거래 크리에이터 시드 데이터 및 브라우저 미리보기 DB
(() => {
    const DEFAULT_POSTERS = [
        {
            id: 'creator-producer-jeju-gamgyul',
            brand_name: '제주 햇살농원 당일수확 고당도 노지감귤 5kg',
            creator_name: '제주 햇살농원 (김성훈 농부)',
            creator_type: 'producer',
            category: '생산자·농축수산 직거래',
            price_info: '24,900원 · 산지 무료배송',
            item_summary: '제초제 없이 키운 서귀포 노지감귤을 수확 당일 농장에서 바로 보내드립니다. 중간 유통 마진 없는 농가 직거래가로 만나보세요.',
            image_url: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=900&q=80',
            phone_number: '010-3842-7788',
            shop_url: 'https://smartstore.naver.com/',
            target_link: 'https://smartstore.naver.com/',
            sns_instagram: 'https://instagram.com/',
            sns_youtube: 'https://youtube.com/',
            sns_blog: 'https://blog.naver.com/',
            sns_kakao: 'https://open.kakao.com/',
            search_keywords: '#제주감귤, #산지직송, #생산자직거래, #노지감귤, #로컬푸드, #햇살농원',
            order_idx: 1,
            created_at: '2026-05-01T09:00:00.000Z',
            updated_at: '2026-05-01T09:00:00.000Z'
        },
        {
            id: 'creator-maker-seongsu-leather',
            brand_name: '성수동 아틀리에 베지터블 가죽 맥세이프 카드지갑',
            creator_name: '아틀리에 결 (이도윤 장인)',
            creator_type: 'maker',
            category: '제조사·수공예·공방 브랜드',
            price_info: '58,000원 · 무료 이니셜 각인',
            item_summary: '이탈리아 베지터블 통가죽을 재단부터 손바느질까지 직접 제작하는 성수동 가죽공방입니다. 공장 직영가로 주문제작합니다.',
            image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80',
            phone_number: '010-5591-2048',
            shop_url: 'https://smartstore.naver.com/',
            target_link: 'https://smartstore.naver.com/',
            sns_instagram: 'https://instagram.com/',
            sns_youtube: 'https://youtube.com/',
            sns_blog: 'https://threads.net/',
            sns_kakao: 'https://open.kakao.com/',
            search_keywords: '#가죽공방, #제조사직거래, #핸드메이드지갑, #성수동공방, #이니셜각인, #아틀리에결',
            order_idx: 2,
            created_at: '2026-05-01T10:00:00.000Z',
            updated_at: '2026-05-01T10:00:00.000Z'
        },
        {
            id: 'creator-creative-brand-pack',
            brand_name: '1인 셀러·소상공인 릴스 & 상세페이지 노션 템플릿 올인원 팩',
            creator_name: '스튜디오 올라운드 (박소연 디렉터)',
            creator_type: 'creative',
            category: '크리에이티브·디지털·지식콘텐츠',
            price_info: '39,000원 · 결제 즉시 다운로드 + 1:1 피드백',
            item_summary: '상세페이지 기획안, 인스타 릴스 대본 50선, 미리캔버스·피그마 템플릿까지 크리에이터가 직접 만든 무형 디지털 콘텐츠입니다.',
            image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80',
            phone_number: '010-7210-9034',
            shop_url: 'https://marpple.shop/',
            target_link: 'https://notion.so/',
            sns_instagram: 'https://instagram.com/',
            sns_youtube: 'https://youtube.com/',
            sns_blog: 'https://threads.net/',
            sns_kakao: 'https://open.kakao.com/',
            search_keywords: '#디지털콘텐츠, #상세페이지템플릿, #릴스대본, #크리에이티브, #노션템플릿, #셀프홍보',
            order_idx: 3,
            created_at: '2026-05-01T11:00:00.000Z',
            updated_at: '2026-05-01T11:00:00.000Z'
        },
        {
            id: 'creator-local-gangneung-roastery',
            brand_name: '강릉 솔향 로스터리 방앗간 흑임자 드립백 & 원두 세트',
            creator_name: '강릉 로컬랩 파도 (최민재 로스터)',
            creator_type: 'local',
            category: '로컬크리에이터·지역특산·공간',
            price_info: '22,000원 · 강릉 로컬 스토리북 동봉',
            item_summary: '강릉 로컬 방앗간 참깨·흑임자와 스페셜티 원두를 블렌딩한 로컬 크리에이터 시그니처 커피입니다. 카페 납품 및 개인 직거래 환영.',
            image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
            phone_number: '010-9142-6612',
            shop_url: 'https://smartstore.naver.com/',
            target_link: 'https://instagram.com/',
            sns_instagram: 'https://instagram.com/',
            sns_youtube: 'https://youtube.com/',
            sns_blog: 'https://blog.naver.com/',
            sns_kakao: 'https://open.kakao.com/',
            search_keywords: '#로컬크리에이터, #강릉커피, #드립백선물, #지역특산품, #직거래로스터리, #로컬랩파도',
            order_idx: 4,
            created_at: '2026-05-01T12:00:00.000Z',
            updated_at: '2026-05-01T12:00:00.000Z'
        },
        {
            id: 'creator-producer-andong-apple',
            brand_name: '안동 해발 500m 고랭지 꿀사과 부사 가정용·선물용 4kg',
            creator_name: '청송·안동 푸른과수원 (정태호 생산자)',
            creator_type: 'producer',
            category: '생산자·농축수산 직거래',
            price_info: '29,500원 · 농장 직송 무료배송',
            item_summary: '일교차 큰 안동 고랭지에서 키운 아삭한 꿀사과입니다. 공판장을 거치지 않고 과수원에서 바로 포장해 발송합니다.',
            image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=900&q=80',
            phone_number: '010-4402-1198',
            shop_url: 'https://smartstore.naver.com/',
            target_link: 'https://smartstore.naver.com/',
            sns_instagram: 'https://instagram.com/',
            sns_youtube: 'https://youtube.com/',
            sns_blog: 'https://blog.naver.com/',
            sns_kakao: 'https://open.kakao.com/',
            search_keywords: '#안동사과, #과수원직거래, #생산자직송, #꿀부사, #농산물직거래, #푸른과수원',
            order_idx: 5,
            created_at: '2026-05-01T13:00:00.000Z',
            updated_at: '2026-05-01T13:00:00.000Z'
        },
        {
            id: 'creator-maker-icheon-ceramic',
            brand_name: '이천 도예공방 수제 백자 머그 & 디저트 플레이트 세트',
            creator_name: '고운흙 도예연구소 (한지우 도예가)',
            creator_type: 'maker',
            category: '제조사·수공예·공방 브랜드',
            price_info: '46,000원 · 공방 직거래 파손보증',
            item_summary: '1250도 가마에서 구워낸 이천 수제 백자 식기입니다. 카페 로고 각인 대량 제작 및 집들이 선물 직거래 주문을 받습니다.',
            image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80',
            phone_number: '010-6325-8821',
            shop_url: 'https://smartstore.naver.com/',
            target_link: 'https://smartstore.naver.com/',
            sns_instagram: 'https://instagram.com/',
            sns_youtube: 'https://youtube.com/',
            sns_blog: 'https://blog.naver.com/',
            sns_kakao: 'https://open.kakao.com/',
            search_keywords: '#이천도자기, #수제머그컵, #제조사직거래, #공방직영, #도예공방, #고운흙',
            order_idx: 6,
            created_at: '2026-05-01T14:00:00.000Z',
            updated_at: '2026-05-01T14:00:00.000Z'
        }
    ];

    window.HONGBOYA_DEFAULT_POSTERS = DEFAULT_POSTERS;

    // 공유 링크용 Base64URL 직렬화 헬퍼 (서버 없이도 타인에게 링크만으로 전체 정보 전달)
    window.encodeHongboSharePack = (poster) => {
        try {
            const minimal = {
                id: poster.id || '',
                brand_name: poster.brand_name || '',
                creator_name: poster.creator_name || '',
                creator_type: poster.creator_type || 'local',
                category: poster.category || '',
                price_info: poster.price_info || '',
                item_summary: poster.item_summary || '',
                image_url: poster.image_url && !poster.image_url.startsWith('data:') ? poster.image_url : '',
                phone_number: poster.phone_number || '',
                shop_url: poster.shop_url || '',
                target_link: poster.target_link || '',
                sns_instagram: poster.sns_instagram || '',
                sns_youtube: poster.sns_youtube || '',
                sns_blog: poster.sns_blog || '',
                sns_kakao: poster.sns_kakao || '',
                search_keywords: poster.search_keywords || ''
            };
            const json = JSON.stringify(minimal);
            const bytes = new TextEncoder().encode(json);
            let binary = '';
            bytes.forEach(b => { binary += String.fromCharCode(b); });
            return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        } catch (e) {
            return '';
        }
    };

    window.decodeHongboSharePack = (encoded) => {
        if (!encoded) return null;
        try {
            const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '==='.slice((base64.length + 3) % 4);
            const binary = atob(padded);
            const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
            return JSON.parse(new TextDecoder().decode(bytes));
        } catch (e) {
            return null;
        }
    };

    window.buildHongboShareUrl = (poster) => {
        if (!poster) return location.href;
        const shareBase = new URL('share.html', location.href).href.split('?')[0].split('#')[0];
        const pack = window.encodeHongboSharePack(poster);
        const idParam = encodeURIComponent(poster.id || 'item');
        return pack
            ? `${shareBase}?brand_id=${idParam}&pack=${encodeURIComponent(pack)}`
            : `${shareBase}?brand_id=${idParam}`;
    };

    const originalFetch = window.fetch.bind(window);
    const storageKey = 'hongboya-preview:' + new URL('.', location.href).pathname;
    const tables = new Set(['poster_settings', 'site_config', 'chatbot_data',
        'consultation_requests', 'franchise_store_rows', 'banners', 'events', 'member_registrations']);
    const reply = (data, status = 200) => new Response(JSON.stringify(data), {
        status, headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

    const loadDb = () => {
        const db = JSON.parse(localStorage.getItem(storageKey) || '{}');
        if (!Array.isArray(db.poster_settings) || db.poster_settings.length === 0) {
            db.poster_settings = DEFAULT_POSTERS.map(item => ({ ...item }));
            localStorage.setItem(storageKey, JSON.stringify(db));
        }
        return db;
    };

    window.fetch = async (input, options = {}) => {
        const url = new URL(input instanceof Request ? input.url : input, location.href);
        const base = new URL('.', location.href).pathname + 'tables/';
        if (url.origin !== location.origin || !url.pathname.startsWith(base)) {
            return originalFetch(input, options);
        }
        const [table, id] = url.pathname.slice(base.length).split('/');
        if (!tables.has(table)) return reply({ error: 'Unknown table' }, 404);
        try {
            const db = loadDb();
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
                    id: id || body.id || crypto.randomUUID(), created_at: id ? rows[index].created_at : now, updated_at: now };
                if (id) rows[index] = result;
                else rows.unshift(result);
            } else return reply({ error: 'Method not allowed' }, 405);
            db[table] = rows;
            localStorage.setItem(storageKey, JSON.stringify(db));
            return reply(result, method === 'POST' ? 201 : 200);
        } catch (error) {
            return reply({ error: '미리보기 저장 실패: ' + error.message }, 400);
        }
    };
})();
