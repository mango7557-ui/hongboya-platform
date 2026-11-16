(() => {
  'use strict';
  const key=window.HONGBOYA_DB_KEY, base=window.HONGBOYA_DB_URL;
  window.hbPublic = async (table, params='') => {
    const response=await fetch(`${base}/rest/v1/${table}?${params}`,{headers:{apikey:key}});
    if(!response.ok) throw new Error('업체 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    return response.json();
  };
  window.hbSafeUrl = value => {try {const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
  window.hbText = (tag, value, className) => {const e=document.createElement(tag);e.textContent=value||'';if(className)e.className=className;return e;};
})();
