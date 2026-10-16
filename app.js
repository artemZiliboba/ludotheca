const root=document.querySelector('#games'),count=document.querySelector('#count');
let games=[];
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const originLabels={fictional:'Вымышленная игра',traditional:'Традиционная игра',unknown:'Происхождение неизвестно'};
function render(){
 const q=document.querySelector('#q').value.toLocaleLowerCase('ru').trim(),sort=document.querySelector('#sort').value;
 const list=games.filter(g=>[g.name,g.original_name||'',...g.evidence.flatMap(e=>[e.work_title,e.work_title_ru||'',e.source.location,e.source.location_ru||'',...(e.mechanics||[])])].join(' ').toLocaleLowerCase('ru').includes(q));
 list.sort((a,b)=>sort==='alpha'?a.name.localeCompare(b.name,'ru'):String(sort==='updated'?b.updated_at:b.added_at).localeCompare(String(sort==='updated'?a.updated_at:a.added_at)));
 root.replaceChildren();count.textContent=`Найдено игр: ${list.length}`;
 if(!list.length){root.append(el('p','meta',games.length?'По запросу ничего не найдено.':'Каталог пока пуст. Первые игры появятся после исследования источников.'));return}
 for(const g of list){
  const card=el('article','card');
  card.append(el('h2','',g.name));
  if(g.original_name)card.append(el('p','meta',`Оригинальное название: ${g.original_name}`));
  if(g.name_is_editorial)card.append(el('p','editorial-note','Название предложено редактором'));
  card.append(el('p','origin-line',`${originLabels[g.origin]||'Происхождение не указано'} · добавлено ${g.added_at}`));
  for(const e of g.evidence){
   card.append(el('h3','work-title',e.work_title_ru||e.work_title));
   if(e.work_title_ru&&e.work_title_ru!==e.work_title)card.append(el('p','original-work',e.work_title));
   const sections=[['Как играют в произведении',e.observed_play],['Правила, прямо указанные в тексте',e.explicit_rules]];
   for(const [heading,lines] of sections){
    if(!lines||!lines.length)continue;
    card.append(el('h4','section-label',heading));
    const ul=el('ul','section-list');for(const line of lines)ul.append(el('li','',line));card.append(ul);
   }
   const a=el('a','source-link',`Источник: ${e.source.location_ru||e.source.location}`);
   a.href=e.source.url;a.target='_blank';a.rel='noopener noreferrer';card.append(a);
   if(e.source.location_ru&&e.source.location_ru!==e.source.location)card.append(el('span','source-original',e.source.location));
  }
  root.append(card);
 }
}
async function init(){
 try{
  if(!window.jsyaml)throw Error('Не удалось загрузить YAML-парсер');
  const response=await fetch('data/games/index.json');if(!response.ok)throw Error('Не удалось прочитать реестр игр');
  const paths=await response.json();
  games=await Promise.all(paths.map(async path=>{
   if(typeof path!=='string'||!/^data\/games\/[a-z0-9-]+[.]yaml$/.test(path))throw Error('Некорректный путь в реестре');
   const r=await fetch(path);if(!r.ok)throw Error('Не удалось прочитать '+path);
   return jsyaml.load(await r.text());
  }));
  render();
 }catch(e){count.textContent='Не удалось загрузить каталог: '+e.message}
}
document.querySelector('#q').addEventListener('input',render);
document.querySelector('#sort').addEventListener('change',render);
init();
