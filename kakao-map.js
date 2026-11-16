(() => {
  'use strict';
  const maps = new Map();
  let sdkPromise;
  const key = String(window.HONGBOYA_KAKAO_MAP_KEY || '').trim();
  const kakaoSearchUrl = query => 'https://map.kakao.com/link/search/' + encodeURIComponent(query);
  function message(container, text, query) {
    container.replaceChildren();
    const panel = document.createElement('div');
    panel.style.cssText = 'height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:155px 20px 35px;background:#f5f5f0;text-align:center;color:#253b31';
    const label = document.createElement('p'); label.textContent = text;
    const link = document.createElement('a'); link.textContent = '카카오맵에서 검색하기 ↗';
    link.href = kakaoSearchUrl(query || '대한민국'); link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.style.cssText = 'padding:10px 16px;background:#fee500;color:#191919;border-radius:8px;font-weight:700';
    panel.append(label, link); container.append(panel);
  }
  function loadSdk() {
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
      if (!key) return reject(new Error('카카오 지도 키가 설정되지 않았습니다.'));
      const script = document.createElement('script');
      script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=services&appkey=' + encodeURIComponent(key);
      script.onerror = () => reject(new Error('카카오 지도를 불러오지 못했습니다. 키와 도메인 등록을 확인해 주세요.'));
      script.onload = () => {
        if (!window.kakao?.maps?.load) return reject(new Error('카카오 지도 초기화에 실패했습니다.'));
        window.kakao.maps.load(() => window.kakao.maps.services ? resolve(window.kakao.maps) : reject(new Error('장소 검색을 불러오지 못했습니다.')));
      };
      document.head.append(script);
    });
    return sdkPromise;
  }
  async function ensureMap(id) {
    if (maps.has(id)) { const state = maps.get(id); state.map.relayout(); return state; }
    const container = document.getElementById(id);
    if (!container) return null;
    try {
      const api = await loadSdk();
      if (maps.has(id)) return maps.get(id);
      container.replaceChildren();
      const state = {api, map: new api.Map(container,{center:new api.LatLng(36.5,127.5),level:13}), markers:[], info:null};
      maps.set(id,state); state.map.relayout(); return state;
    } catch (error) { message(container,error.message); return null; }
  }
  window.resizeLeafletMap = id => { window.setTimeout(() => ensureMap(id), 100); };
  window.searchGoogleMap = async (inputId = 'map-search-input', containerId = 'google-map-iframe') => {
    const query = document.getElementById(inputId)?.value.trim();
    if (!query) { alert('검색할 장소나 업체명을 입력해 주세요.'); return; }
    const state = await ensureMap(containerId);
    if (!state) { message(document.getElementById(containerId),'카카오 지도를 불러오지 못했습니다.',query); return; }
    const {api,map} = state;
    new api.services.Places().keywordSearch(query, (places,status) => {
      if (status !== api.services.Status.OK) { alert(status === api.services.Status.ZERO_RESULT ? '검색 결과가 없습니다. 다른 검색어를 입력해 주세요.' : '장소 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.'); return; }
      state.markers.forEach(marker => marker.setMap(null)); state.markers = [];
      state.info?.close(); const bounds = new api.LatLngBounds();
      places.forEach(place => {
        const point = new api.LatLng(Number(place.y),Number(place.x));
        const marker = new api.Marker({map,position:point}); state.markers.push(marker); bounds.extend(point);
        api.event.addListener(marker,'click',() => {
          state.info?.close();
          const content = document.createElement('div'); content.style.cssText = 'padding:10px;min-width:150px;color:#222';
          const name = document.createElement('strong'); name.textContent = place.place_name;
          const link = document.createElement('a'); link.textContent = ' 카카오맵에서 보기 ↗'; link.href = place.place_url; link.target = '_blank'; link.rel = 'noopener noreferrer';
          content.append(name,document.createElement('br'),link);
          state.info = new api.InfoWindow({content,removable:true}); state.info.open(map,marker);
        });
      });
      map.setBounds(bounds);
    });
  };
  window.loadCurrentLocationToMap = async force => {
    if (!force) return;
    const state = await ensureMap('google-map-iframe');
    if (!state) return;
    if (!navigator.geolocation) { alert('이 브라우저에서는 현재 위치를 사용할 수 없습니다.'); return; }
    navigator.geolocation.getCurrentPosition(position => {
      const point = new state.api.LatLng(position.coords.latitude,position.coords.longitude);
      state.locationMarker?.setMap(null); state.locationMarker = new state.api.Marker({map:state.map,position:point});
      state.map.setLevel(4); state.map.setCenter(point);
    }, () => alert('현재 위치를 가져올 수 없습니다. 브라우저의 위치 권한을 확인해 주세요.'), {timeout:10000});
  };
})();
