const categories=[['all','全部'],['places','街巷'],['story','故事'],['portraits','居民'],['details','小物'],['weather','天色']];
const names=Object.fromEntries(categories);
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const query=new URLSearchParams(location.search);
let category=categories.some(([id])=>id===query.get('category'))?query.get('category'):'all';
let assets=[];let selected=[];let visibleCount=24;let currentIndex=0;
const elements=Object.fromEntries(['album-total','album-filters','album-summary','album-grid','album-error','album-more','album-page-note','album-lightbox','lightbox-image','lightbox-title','lightbox-category','lightbox-index','lightbox-download'].map(id=>[id,document.getElementById(id)]));
const assetUrl=path=>new URL('../'+path,import.meta.url).href;
function render(){
  selected=assets.filter(asset=>category==='all'||asset.category===category);
  elements['album-filters'].innerHTML=categories.map(([id,name])=>`<button class="album-filter" data-category="${id}" aria-pressed="${id===category}">${name}<span>${id==='all'?assets.length:assets.filter(asset=>asset.category===id).length}</span></button>`).join('');
  elements['album-grid'].innerHTML=selected.slice(0,visibleCount).map(asset=>`<button class="album-card" data-image="${escape(asset.id)}" aria-label="翻开：${escape(asset.title)}"><div class="album-card-image"><img src="${assetUrl(asset.thumbnail||asset.path)}" width="480" height="320" alt="${escape(asset.title)}" loading="lazy" decoding="async"/></div><div class="album-card-caption"><h2>${escape(asset.title)}</h2><span>${names[asset.category]||'小城'}</span></div></button>`).join('');
  elements['album-summary'].textContent=`${selected.length} 幅 · ${names[category]}`;
  elements['album-page-note'].textContent=`翻到 ${Math.min(visibleCount,selected.length)} / ${selected.length} 页`;
  elements['album-more'].hidden=visibleCount>=selected.length;
  const url=new URL(location.href);if(category==='all')url.searchParams.delete('category');else url.searchParams.set('category',category);history.replaceState(null,'',url);
}
function showImage(index){
  currentIndex=(index+selected.length)%selected.length;
  const asset=selected[currentIndex];if(!asset)return;
  elements['lightbox-image'].src=assetUrl(asset.path);
  elements['lightbox-image'].alt=asset.title;
  elements['lightbox-title'].textContent=asset.title;
  elements['lightbox-category'].textContent=`潮生 · ${names[asset.category]}`;
  elements['lightbox-index'].textContent=`${currentIndex+1} / ${selected.length}`;
  elements['lightbox-download'].href=assetUrl(asset.path);
  elements['lightbox-download'].download=`潮生-${asset.title}.webp`;
  if(!elements['album-lightbox'].open)elements['album-lightbox'].showModal();
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.category){category=button.dataset.category;visibleCount=24;render();document.querySelector(`[data-category="${category}"]`).focus({preventScroll:true});}
  if(button.dataset.image)showImage(selected.findIndex(asset=>asset.id===button.dataset.image));
  if(button.id==='album-more'){const previous=visibleCount;visibleCount+=24;render();const card=elements['album-grid'].children[previous];if(card)card.focus({preventScroll:true});}
  if(button.id==='album-close')elements['album-lightbox'].close();
  if(button.id==='album-previous')showImage(currentIndex-1);
  if(button.id==='album-next')showImage(currentIndex+1);
});
document.addEventListener('keydown',event=>{if(!elements['album-lightbox'].open)return;if(event.key==='ArrowLeft'){event.preventDefault();showImage(currentIndex-1);}if(event.key==='ArrowRight'){event.preventDefault();showImage(currentIndex+1);}});
elements['album-lightbox'].addEventListener('click',event=>{if(event.target!==elements['album-lightbox'])return;const rect=elements['album-lightbox'].getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)elements['album-lightbox'].close();});
try{
  const response=await fetch(new URL('../public/gallery-catalog.json?v=0.2.0',import.meta.url));if(!response.ok)throw new Error('Catalog unavailable');
  const catalog=await response.json();assets=catalog.assets;elements['album-total'].textContent=assets.length;render();
  const requested=query.get('image');if(requested){const index=selected.findIndex(asset=>asset.id===requested);if(index>=0)showImage(index);}
  window.duskTownAlbum=Object.freeze({count:assets.length,counts:Object.fromEntries(categories.map(([id])=>[id,id==='all'?assets.length:assets.filter(asset=>asset.category===id).length]))});
}catch{elements['album-error'].hidden=false;elements['album-summary'].textContent='稍后再来';}
