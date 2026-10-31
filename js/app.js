(function(){
  'use strict';
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var $=function(s,c){return (c||document).querySelector(s)};
  var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
  var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
  var hdr=$('#hdr'),veil=$('#veil'),fab=$('#fab'),pl=$('#pl');
  var pages={};$$('.page').forEach(function(p){pages[p.getAttribute('data-page')]=p});
  var current=null,slideTimer=null,rio=null,introDone=false;

  /* =========================================================
     ROZPAD TEXTU NA PÍSMENA
     ========================================================= */
  function split(el){
    if(el.__split)return;el.__split=true;
    el.setAttribute('aria-label',el.textContent.replace(/\s+/g,' ').trim());
    var idx=0;
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(ch){
        if(ch.nodeType===3){
          var frag=document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function(part){
            if(!part)return;
            if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(' '));return}
            var w=document.createElement('span');w.className='w';w.setAttribute('aria-hidden','true');
            Array.from(part).forEach(function(chr){var c=document.createElement('span');c.className='c';c.textContent=chr;c.style.setProperty('--d',Math.min(idx*(el.hasAttribute('data-hero')?42:24),1100)+'ms');c.style.setProperty('--wd',(idx*45)+'ms');idx++;w.appendChild(c)});
            frag.appendChild(w);
          });
          node.replaceChild(frag,ch);
        }else if(ch.nodeType===1&&ch.tagName!=='BR'){walk(ch)}
      });
    })(el);
  }
  $$('[data-split]').forEach(split);
  function splitWords(el){
    if(el.__hl)return;el.__hl=true;
    var words=el.textContent.trim().split(/\s+/);el.textContent='';
    words.forEach(function(w,i){var s=document.createElement('span');s.className='hw';s.textContent=w;el.appendChild(s);if(i<words.length-1)el.appendChild(document.createTextNode(' '))});
  }
  $$('[data-hl]').forEach(splitWords);

  /* =========================================================
     HLAVIČKA, MENU, PLOVOUCÍ TLAČÍTKO
     ========================================================= */
  var lastY=0;
  function headerState(){
    var y=window.scrollY;
    var solidPage=current&&current.hasAttribute('data-solid');
    hdr.classList.toggle('solid',solidPage||y>40);
    hdr.classList.toggle('compact',y>260);
    var menuOpen=document.body.classList.contains('menu-open');
    if(y<lastY-4||y<300||menuOpen)hdr.classList.remove('hide');else if(y>lastY+4)hdr.classList.add('hide');
    lastY=y;
    // plovoucí kalkulačka
    var calcVisible=false;
    $$('.calc',current||document).forEach(function(c){var r=c.getBoundingClientRect();if(r.top<window.innerHeight*.75&&r.bottom>window.innerHeight*.25)calcVisible=true});
    fab.classList.toggle('show',introDone&&y>window.innerHeight*.6&&!calcVisible&&!menuOpen);
  }
  window.addEventListener('scroll',headerState,{passive:true});

  var burger=$('#burger'),mm=$('#mmenu');
  function setMenu(o){document.body.classList.toggle('menu-open',o);burger.setAttribute('aria-expanded',o);mm.setAttribute('aria-hidden',!o);burger.setAttribute('aria-label',o?'Zavřít menu':'Otevřít menu');document.body.style.overflow=o?'hidden':'';headerState()}
  burger.addEventListener('click',function(){setMenu(!document.body.classList.contains('menu-open'))});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.body.classList.contains('menu-open'))setMenu(false)});

  // logo „mluví" každých pár sekund
  var brandLogo=$('.brand .logo');
  if(!reduce&&brandLogo)setInterval(function(){brandLogo.classList.remove('talk');void brandLogo.getBBox();brandLogo.classList.add('talk')},7000);

  /* =========================================================
     ODHALOVÁNÍ PŘI SCROLLU
     ========================================================= */
  function initReveal(page){
    if(rio)rio.disconnect();
    var els=$$('.rv,.rv-img,[data-split]:not([data-hero]),[data-odo]',page);
    var foot=$$('.foot [data-split],#giant');
    els=els.concat(foot);
    if(!('IntersectionObserver' in window)||reduce){els.forEach(function(e){e.classList.add('in');if(e.hasAttribute('data-odo'))odoGo(e)});return}
    rio=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;var el=e.target;
      if(el.classList.contains('rv')){
        var sib=$$(':scope > .rv',el.parentElement).filter(function(s){return !s.classList.contains('in')});
        el.style.transitionDelay=Math.min(Math.max(0,sib.indexOf(el))*90,450)+'ms';
      }
      el.classList.add('in');
      if(el.hasAttribute('data-odo'))odoGo(el);
      rio.unobserve(el);
    })},{rootMargin:'0px 0px -8% 0px',threshold:.01});
    els.forEach(function(e){if(!e.classList.contains('in'))rio.observe(e)});
  }

  /* odometr */
  function odoBuild(el){
    if(el.__odo)return;el.__odo=true;
    var txt=el.textContent.trim();el.setAttribute('aria-label',txt);el.textContent='';
    el.classList.add('odo');
    Array.from(txt).forEach(function(ch,i){
      if(/\d/.test(ch)){var col=document.createElement('span');col.className='col';col.setAttribute('aria-hidden','true');for(var k=0;k<=19;k++){var s=document.createElement('span');s.textContent=k%10;col.appendChild(s)}col.dataset.v=10+(+ch);col.style.setProperty('--d',(i*120)+'ms');el.appendChild(col)}
      else{var s=document.createElement('span');s.textContent=ch;s.setAttribute('aria-hidden','true');el.appendChild(s)}
    });
  }
  function odoGo(el){$$('.col',el).forEach(function(c){c.style.transform='translateY(-'+c.dataset.v+'em)'})}
  $$('[data-odo]').forEach(odoBuild);

  /* zvýraznění slov při scrollu */
  function highlight(){
    if(!current)return;
    $$('[data-hl]',current).forEach(function(el){
      var r=el.getBoundingClientRect(),vh=window.innerHeight;
      var p=clamp((vh*.88-r.top)/(r.height+vh*.42),0,1);
      var ws=el.children,n=ws.length,on=Math.round(p*n*1.08);
      for(var i=0;i<n;i++)ws[i].classList.toggle('on',i<on||reduce);
    });
  }

  /* =========================================================
     HERO: prolínání, písmo reagující na kurzor, vlna
     ========================================================= */
  function initSlides(page){
    clearInterval(slideTimer);
    var box=$('[data-slides]',page);if(!box)return;
    var imgs=$$('img',box),dots=$('[data-dots]',page),i=0;
    if(imgs.length<2)return;
    if(dots){dots.innerHTML='';imgs.forEach(function(_,k){var b=document.createElement('button');b.setAttribute('aria-label','Fotografie '+(k+1));if(k===0)b.className='on';b.addEventListener('click',function(){go(k);restart()});dots.appendChild(b)})}
    function go(k){imgs[i].classList.remove('on');i=(k+imgs.length)%imgs.length;imgs[i].classList.add('on');if(dots)$$('button',dots).forEach(function(b,n){b.classList.remove('on');if(n===i){void b.offsetWidth;b.classList.add('on')}})}
    function restart(){clearInterval(slideTimer);if(!reduce)slideTimer=setInterval(function(){go(i+1)},6500)}
    restart();
  }
  var waveTimer=null;
  function heroType(page){
    clearInterval(waveTimer);
    var h=$('h1[data-hero]',page);if(!h)return;
    h.classList.remove('in','hot','wave');
    requestAnimationFrame(function(){requestAnimationFrame(function(){h.classList.add('in')})});
    if(reduce)return;
    var chars=$$('.c',h);
    setTimeout(function(){
      h.classList.add('hot');
      waveTimer=setInterval(function(){if(h.__hover)return;h.classList.remove('wave');void h.offsetWidth;h.classList.add('wave')},6000);
    },chars.length*42+1500);
    if(!fine||h.__bound)return;h.__bound=true;
    var hero=h.closest('.hero'),rects=[],raf=null,mx=0,my=0;
    function measure(){rects=chars.map(function(c){var r=c.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})}
    hero.addEventListener('pointerenter',function(){h.__hover=true;h.classList.remove('wave');measure()});
    hero.addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY;if(!h.classList.contains('hot'))return;if(!raf)raf=requestAnimationFrame(function(){raf=null;
      chars.forEach(function(c,i){var d=Math.hypot(rects[i][0]-mx,rects[i][1]-my);var f=1-clamp(d/260,0,1);var thin=!!c.closest('em');var base=thin?200:900;var w=thin?base+f*700:base-f*700;c.style.fontWeight=Math.round(w);c.style.transform=f>0?'translateY('+(-f*6).toFixed(1)+'%)':''})})});
    hero.addEventListener('pointerleave',function(){h.__hover=false;chars.forEach(function(c){c.style.fontWeight='';c.style.transform=''})});
    window.addEventListener('scroll',function(){if(h.__hover)measure()},{passive:true});
  }

  /* =========================================================
     PARALAXA, RYCHLOSTNÍ PÁS, HORIZONTÁLNÍ GALERIE
     ========================================================= */
  var vel=0,lastScroll=window.scrollY;
  function parallax(){
    if(reduce||!current)return;
    var vh=window.innerHeight;
    $$('[data-parallax]',current).forEach(function(img){var r=img.parentElement.getBoundingClientRect();if(r.bottom<0||r.top>vh)return;var p=(r.top+r.height/2-vh/2)/vh;img.style.transform='translate3d(0,'+(p*-10).toFixed(2)+'%,0)'});
  }
  var marqs=$$('[data-vmarq]').map(function(m){var t=$('.vt',m);t.innerHTML+=t.innerHTML+t.innerHTML;return {m:m,t:t,x:0,dir:m.closest('#p-firemni-akce')?1:-1}});
  (function loop(){
    var y=window.scrollY;vel=vel*.88+(y-lastScroll)*.12;lastScroll=y;
    if(!reduce)marqs.forEach(function(o){if(!o.m.offsetParent)return;var w=o.t.scrollWidth/3;o.x+=o.dir*(.6+Math.abs(vel)*.5);if(o.x<-w)o.x+=w;if(o.x>0)o.x-=w;o.t.style.transform='translate3d('+o.x.toFixed(1)+'px,0,0) skewX('+clamp(-vel*.35,-12,12).toFixed(2)+'deg)'});
    requestAnimationFrame(loop);
  })();
  function hpinSize(){
    $$('[data-hpin]').forEach(function(sec){var tr=$('.htrack',sec);if(window.innerWidth<=860){sec.style.height='';return}var extra=tr.scrollWidth-window.innerWidth+parseFloat(getComputedStyle(tr).paddingLeft);sec.style.height=(window.innerHeight+Math.max(0,extra))+'px';sec.__extra=Math.max(0,extra)});
  }
  function hpin(){
    if(!current||window.innerWidth<=860)return;
    $$('[data-hpin]',current).forEach(function(sec){var r=sec.getBoundingClientRect();var tot=sec.offsetHeight-window.innerHeight;var p=clamp(-r.top/tot,0,1);$('.htrack',sec).style.transform='translate3d('+(-p*(sec.__extra||0)).toFixed(1)+'px,0,0)';$('.hprog',sec).style.setProperty('--p',(p*100).toFixed(1)+'%')});
  }
  window.addEventListener('resize',function(){hpinSize();hpin()});
  $$('[data-hpin] img').forEach(function(i){i.addEventListener('load',function(){hpinSize()})});
  window.addEventListener('scroll',function(){requestAnimationFrame(function(){parallax();hpin();highlight()})},{passive:true});

  /* magnetická tlačítka */
  if(fine&&!reduce)$$('[data-mag]').forEach(function(b){
    b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();var dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);b.style.transform='translate('+(dx*.22).toFixed(1)+'px,'+(dy*.32).toFixed(1)+'px)'});
    b.addEventListener('pointerleave',function(){b.style.transform=''});
  });

  /* =========================================================
     HLEDIŠTĚ 273 MÍST (13 řad × 21 sedadel)
     ========================================================= */
  var NS='http://www.w3.org/2000/svg';
  function buildSeats(svg){
    var cx=320,cy=-20,seats=[];
    var st=document.createElementNS(NS,'path');var R0=96,a0=40*Math.PI/180;
    st.setAttribute('d','M'+(cx-R0*Math.sin(a0)).toFixed(1)+' '+(cy+R0*Math.cos(a0)).toFixed(1)+' A'+R0+' '+R0+' 0 0 0 '+(cx+R0*Math.sin(a0)).toFixed(1)+' '+(cy+R0*Math.cos(a0)).toFixed(1));
    st.setAttribute('class','stage');svg.appendChild(st);
    var t=document.createElementNS(NS,'text');t.setAttribute('x',cx);t.setAttribute('y',58);t.setAttribute('class','stage-t');t.textContent='JEVIŠTĚ';svg.appendChild(t);
    for(var r=0;r<13;r++){var R=140+r*14.6,span=46*Math.PI/180;
      for(var k=0;k<21;k++){var th=-span+(2*span)*k/20;var c=document.createElementNS(NS,'circle');c.setAttribute('cx',(cx+R*Math.sin(th)).toFixed(1));c.setAttribute('cy',(cy+R*Math.cos(th)).toFixed(1));c.setAttribute('r',4.9);c.setAttribute('class','seat');svg.appendChild(c);seats.push({el:c,r:r,k:k})}}
    seats.sort(function(a,b){return a.r-b.r||Math.abs(a.k-10)-Math.abs(b.k-10)||a.k-b.k});
    svg.__seats=seats.map(function(s){return s.el});svg.__n=0;
  }
  function setSeats(svg,n,off){
    var s=svg.__seats;if(!s)return;var prev=svg.__n||0;n=clamp(n,0,273);
    svg.classList.toggle('off',!!off);
    s.forEach(function(el,i){var on=i<n;if(on!==el.classList.contains('on')){el.style.transitionDelay=reduce?'0ms':(Math.abs(i-(on?prev:n))*3)+'ms';el.classList.toggle('on',on);if(on&&!reduce){el.classList.add('pop');setTimeout(function(){el.classList.remove('pop')},260+Math.abs(i-prev)*3)}}});
    svg.__n=n;
  }
  $$('[data-seats]').forEach(buildSeats);
  function meter(el,v,max,txt){var p=clamp(v/max*100,0,100);el.querySelector('i').style.setProperty('--v',p+'%');el.querySelector('b').textContent=txt;el.classList.toggle('over',v>max)}
  var PKG={generalka:['Generálka','Blok vstupenek, welcome drink a finger food'],premiera:['Premiéra','Zadané představení, raut a afterparty'],gala:['Gala','Celé divadlo i kavárna jen pro vás'],kavarna:['Večírek v kavárně','Raut a bar, bez představení'],den:['Konference','Denní program, coffee break a raut']};
  function recommend(n,show,type){
    if(type==='konference'||type==='tiskovka')return 'den';
    if(show==='bez')return 'kavarna';
    if(n<=40)return 'generalka';
    if(n<=180)return 'premiera';
    return 'gala';
  }
  function setReco(el,key){var p=PKG[key];var b=el.querySelector('b');if(b.textContent!==p[0]){b.textContent=p[0];el.querySelector('span').textContent=p[1];if(!reduce)el.animate([{transform:'scale(.96)',opacity:.5},{transform:'none',opacity:1}],{duration:450,easing:'cubic-bezier(.34,1.56,.64,1)'})}}
  function rollNum(out,n){
    var from=+out.textContent||0;if(from===n)return;if(reduce){out.textContent=n;return}
    var st=performance.now();cancelAnimationFrame(out.__r);
    (function f(t){var p=Math.min(1,(t-st)/350);out.textContent=Math.round(from+(n-from)*(1-Math.pow(1-p,3)));if(p<1)out.__r=requestAnimationFrame(f)})(st);
  }

  /* teaser na úvodu */
  var tG=$('#tGuests'),tSeats=$('#tSeats');
  function teaser(){
    if(!tG)return;var n=+tG.value,type=($('[name="tt"]:checked')||{}).value||'divadelni';var show=type==='divadelni'?'zadane':'bez';
    tG.style.setProperty('--p',((n-10)/290*100)+'%');rollNum($('#tOut'),n);
    setSeats(tSeats,show==='bez'?0:n,show==='bez');
    meter($('#tmSal'),show==='bez'?0:Math.min(n,273),273,show==='bez'?'bez představení':Math.min(n,273)+' / 273');
    meter($('#tmKav'),n,300,n+' / 300');
    setReco($('#tReco'),recommend(n,show,type));
  }
  if(tG){tG.addEventListener('input',teaser);$$('[name="tt"]').forEach(function(r){r.addEventListener('change',teaser)})}

  /* =========================================================
     PLNÁ KALKULAČKA
     ========================================================= */
  var form=$('#cfg'),panels=form?$$('.panel',form):[],tabs=$$('#tabs button'),cur=0,maxR=0,g=$('#guests'),fSeats=$('#fSeats');
  var TITLES={divadelni:'Divadelní večer',vecirek:'Firemní večírek',konference:'Konference',raut:'Raut, recepce',tiskovka:'Tisková konference',oslava:'Oslava, výročí'};
  function val(n){var el=form.querySelector('[name="'+n+'"]:checked');return el?el.value:''}
  function vals(n){return $$('[name="'+n+'"]:checked',form).map(function(x){return x.value})}
  function hm(m){var h=Math.floor(m/60)%24,mm=m%60;return h+':'+(mm<10?'0':'')+mm}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function advice(n){
    if(n<=40)return 'Pro skupinu do 40 lidí doporučujeme blok vstupenek a rezervovanou zónu v kavárně.';
    if(n<=180)return 'Zvažte zadané představení: sál má 273 míst, volná místa můžete nabídnout klientům.';
    if(n<=273)return 'S tímto počtem se vyplatí zadané představení pro celý sál a kavárna jen pro vás.';
    return 'Hlediště má 273 míst. Pro '+n+' hostů navrhneme raut pro všechny a představení pro 273 z nich.';
  }
  function render(){
    if(!form)return;
    var n=+g.value,type=val('type'),show=val('show'),cat=vals('cat'),part=$('#f-part').value;
    g.style.setProperty('--p',((n-10)/290*100)+'%');rollNum($('#gOut'),n);$('#advice').textContent=advice(n);
    $('#sTitle').textContent=TITLES[type]||'Firemní akce';$('#sGuests').textContent=n+' hostů';
    setSeats(fSeats,show==='bez'?0:n,show==='bez');
    meter($('#fmSal'),show==='bez'?0:Math.min(n,273),273,show==='bez'?'bez představení':Math.min(n,273)+' / 273');
    meter($('#fmKav'),n,300,n+' / 300');
    var rk=recommend(n,show,type);setReco($('#fReco'),rk);
    var mg=$('#mGuests');if(mg){mg.textContent=n;$('#mSal').textContent=show==='bez'?'Bez představení':'Sál '+Math.min(n,273)+' / 273';$('#mBar').style.setProperty('--v',(show==='bez'?0:Math.min(n,273)/273*100)+'%');$('#mReco').textContent=PKG[rk][0]}
    $$('.pkg').forEach(function(p){p.classList.toggle('hit',p.getAttribute('data-pk')===rk)});
    var m=part==='den'?9*60:part==='odpoledne'?14*60:17*60+30,items=[];
    if(type==='konference'||type==='tiskovka'){items.push([m,'Registrace a káva','Příchod hostů v kavárně']);m+=30;items.push([m,type==='tiskovka'?'Tisková konference':'Program konference','Prostor u logo stěny, technika na vyžádání']);m+=type==='tiskovka'?60:150}
    if(cat.indexOf('Welcome drink')>-1){items.push([m,'Welcome drink','Sekt, víno Bonitas, nealko']);m+=30}
    var food=cat.filter(function(c){return /raut|Finger/.test(c)});
    if(food.length){items.push([m,'Raut v kavárně',food.join(', ')+(cat.indexOf('Nápoje')>-1?' · nápoje':'')]);m+=60}
    if(show!=='bez'){var s0=Math.max(m,part==='vecer'?19*60:m);items.push([s0,show==='zadane'?'Zadané představení':'Představení',show==='zadane'?'Celý sál, 273 míst':'Blok vstupenek']);m=s0+135}
    if(cat.indexOf('Afterparty')>-1)items.push([m,'Afterparty','Bar v kavárně, klidně do rána']);
    var html=items.map(function(it){return '<li><span class="t">'+hm(it[0])+'</span><span><b>'+esc(it[1])+'</b><span>'+esc(it[2])+'</span></span></li>'}).join('');
    var pr=$('#prog');if(pr.__h!==html){pr.innerHTML=html;pr.__h=html}
  }
  function step(i){
    cur=i;maxR=Math.max(maxR,i);
    panels.forEach(function(p,k){p.classList.toggle('cur',k===i)});
    tabs.forEach(function(b,k){b.classList.toggle('cur',k===i);b.classList.toggle('done',k!==i&&k<=maxR);b.disabled=k>maxR});
    $('#prev').hidden=i===0;$('#count').textContent='Krok '+(i+1)+' ze '+panels.length;
    $('#next').innerHTML=i===panels.length-1?'Odeslat poptávku <span class="ar">→</span>':'Pokračovat <span class="ar">→</span>';
  }
  function setRadio(n,v){var el=form&&form.querySelector('[name="'+n+'"][value="'+v+'"]');if(el)el.checked=true}
  function setCats(l){$$('[name="cat"]',form).forEach(function(c){c.checked=l.indexOf(c.value)>-1})}
  function reset(){if(form.hidden){form.hidden=false;$('#tabs').hidden=false;$('#done').classList.remove('show')}}
  function prefillType(t){if(!form)return;setRadio('type',t);
    if(t==='konference'||t==='tiskovka'){setRadio('show','bez');$('#f-part').value='den';setCats(['Welcome drink','Finger food','Nápoje'])}
    else if(t==='raut'||t==='oslava'||t==='vecirek'){setRadio('show','bez');$('#f-part').value='vecer';setCats(['Welcome drink','Studený raut','Teplý raut','Nápoje'].concat(t==='vecirek'?['Afterparty']:[]))}
    else{setRadio('show','zadane');$('#f-part').value='vecer';setCats(['Welcome drink','Studený raut','Teplý raut','Nápoje','Afterparty'])}
    reset();render();step(0)}
  function prefillPkg(p){if(!form)return;var P={generalka:[40,'vstupenky',['Welcome drink','Finger food','Nápoje']],premiera:[120,'zadane',['Welcome drink','Studený raut','Teplý raut','Nápoje','Afterparty']],gala:[250,'zadane',['Welcome drink','Finger food','Studený raut','Teplý raut','Nápoje','Afterparty']]}[p];
    setRadio('type','divadelni');g.value=P[0];setRadio('show',P[1]);setCats(P[2]);$('#f-part').value='vecer';reset();maxR=3;render();step(1)}
  function fromTeaser(){if(!form||!tG)return;var t=($('[name="tt"]:checked')||{}).value||'divadelni';prefillType(t);g.value=tG.value;maxR=Math.max(maxR,1);render();step(1)}
  if(form){
    $('#next').addEventListener('click',function(){
      if(cur<panels.length-1){step(cur+1);toCalc();return}
      var ok=true;
      [['f-company',function(v){return v.trim().length>1}],['f-name',function(v){return v.trim().length>2}],['f-email',function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())}]].forEach(function(c){var el=$('#'+c[0]),good=c[1](el.value);el.closest('.field').classList.toggle('err',!good);if(!good&&ok){el.focus();ok=false}});
      if(!ok)return;
      form.hidden=true;$('#tabs').hidden=true;
      var nm=$('#f-name').value.trim().split(' ')[0];$('#doneName').textContent=nm||'ozveme se';$('#doneEmail').textContent=$('#f-email').value.trim();
      var d=$('#done');d.classList.add('show');d.focus({preventScroll:true});toCalc();
    });
    $('#prev').addEventListener('click',function(){if(cur>0)step(cur-1)});
    tabs.forEach(function(b,k){b.addEventListener('click',function(){if(k<=maxR)step(k)})});
    $('#edit').addEventListener('click',function(){reset();step(3)});
    ['f-company','f-name','f-email','k-name','k-email'].forEach(function(id){var el=$('#'+id);if(el)el.addEventListener('input',function(){el.closest('.field').classList.remove('err')})});
    form.addEventListener('input',render);form.addEventListener('change',render);
    form.addEventListener('submit',function(e){e.preventDefault();$('#next').click()});
  }
  function toCalc(){var t=$('#tabs')&&!$('#tabs').hidden?$('#tabs'):$('#done');if(!t)return;var top=t.getBoundingClientRect().top;if(top<90||top>window.innerHeight*.6)scrollToId('kalkulacka',true)}

  /* =========================================================
     SMĚROVÁNÍ MEZI STRÁNKAMI
     ========================================================= */
  function scrollToId(id,smooth){var el=document.getElementById(id);if(!el)return;var top=el.getBoundingClientRect().top+window.scrollY-(id==='kalkulacka'?0:70);window.scrollTo({top:top,behavior:smooth&&!reduce?'smooth':'auto'})}
  function show(name,target,push){
    if(!pages[name])name='domu';
    var page=pages[name];setMenu(false);
    if(current===page){if(target)scrollToId(target,true);else window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});return}
    if(push){try{history.pushState({p:name},'','#'+name)}catch(e){}}
    var swap=function(){
      if(current)current.classList.remove('on','shown');
      clearInterval(slideTimer);current=page;page.classList.add('on');
      document.title=page.getAttribute('data-title')||'Kavárna DRBárna';
      $$('.nav a.nl').forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+name)});
      window.scrollTo(0,0);lastY=0;hdr.classList.remove('hide');
      initReveal(page);initSlides(page);hpinSize();
      if(name==='domu')teaser();if(name==='firemni-akce')render();
      var go=function(){page.classList.add('shown');heroType(page);headerState();parallax();highlight();hpin()};
      if(introDone)requestAnimationFrame(function(){requestAnimationFrame(go)});else page.__pending=go;
      if(target)setTimeout(function(){scrollToId(target,true)},introDone?420:0);
      if(veil.classList.contains('on')){veil.classList.add('up');setTimeout(function(){veil.classList.remove('on','up')},560)}
      headerState();
    };
    if(current&&!reduce){veil.classList.remove('up');veil.classList.add('on');setTimeout(swap,560)}else swap();
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href^="#"]');if(!a)return;
    var name=a.getAttribute('href').slice(1);if(!pages[name])return;
    e.preventDefault();
    if(a.hasAttribute('data-teaser'))fromTeaser();
    var pre=a.getAttribute('data-pre'),pkg=a.getAttribute('data-pkg');
    if(pre)prefillType(pre);if(pkg)prefillPkg(pkg);
    show(name,a.getAttribute('data-to'),true);
  });
  window.addEventListener('popstate',function(){var n=(location.hash||'').slice(1);show(pages[n]?n:'domu',null,false)});

  /* =========================================================
     KARTY S NÁHLEDEM, GALERIE, KOPÍROVÁNÍ, KONTAKT
     ========================================================= */
  var peek=$('#peek');
  if(peek&&fine&&!reduce){
    var imgs={},px=0,py=0,tx=0,ty=0;
    $$('#rows .row').forEach(function(r){var src=r.getAttribute('data-peek');if(!imgs[src]){var im=document.createElement('img');im.src=(window.__IMG&&window.__IMG[src.replace('img/','')])||src;im.alt='';peek.appendChild(im);imgs[src]=im}
      r.addEventListener('mouseenter',function(){Object.keys(imgs).forEach(function(k){imgs[k].classList.toggle('on',k===src)});peek.classList.add('on')});
      r.addEventListener('mouseleave',function(){peek.classList.remove('on')});
    });
    window.addEventListener('mousemove',function(e){tx=e.clientX;ty=e.clientY});
    (function loop(){px+=(tx-px)*.15;py+=(ty-py)*.15;if(peek.classList.contains('on')){peek.style.left=px+'px';peek.style.top=py+'px'}requestAnimationFrame(loop)})();
  }
  var gal=$('#gal'),lb=$('#lb'),lbImg=$('#lbImg'),lbCap=$('#lbCap'),gi=0,list=[],lastFocus=null;
  $$('#filters button').forEach(function(b){b.addEventListener('click',function(){
    var f=b.getAttribute('data-f');$$('#filters button').forEach(function(x){x.classList.toggle('on',x===b)});
    var k=0;$$('button',gal).forEach(function(g){var showIt=f==='all'||g.getAttribute('data-c')===f;g.hidden=!showIt;if(showIt){g.style.animation='none';void g.offsetWidth;g.style.animation='';g.style.animationDelay=(k++*40)+'ms'}});
  })});
  function vis(){return $$('button',gal).filter(function(g){return !g.hidden})}
  function lbShow(k){gi=(k+list.length)%list.length;var im=list[gi].querySelector('img');lbImg.src=im.currentSrc||im.src;lbImg.alt=im.alt;lbCap.textContent=(gi+1)+' / '+list.length+' · '+list[gi].getAttribute('data-cap')}
  function lbOpen(btn){list=vis();lastFocus=btn;lbShow(list.indexOf(btn));lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#lbX').focus()}
  function lbClose(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');document.body.style.overflow='';if(lastFocus)lastFocus.focus()}
  if(gal)$$('button',gal).forEach(function(b){b.addEventListener('click',function(){lbOpen(b)})});
  $('#lbX').addEventListener('click',lbClose);$('#lbP').addEventListener('click',function(){lbShow(gi-1)});$('#lbN').addEventListener('click',function(){lbShow(gi+1)});
  lb.addEventListener('click',function(e){if(e.target===lb)lbClose()});
  document.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape')lbClose();if(e.key==='ArrowRight')lbShow(gi+1);if(e.key==='ArrowLeft')lbShow(gi-1)});
  $$('[data-copy]').forEach(function(b){b.addEventListener('click',function(){
    var t=b.getAttribute('data-copy'),o=b.textContent;
    var ok=function(){b.textContent='Zkopírováno';b.classList.add('ok');setTimeout(function(){b.textContent=o;b.classList.remove('ok')},1800)};
    var fb=function(){var v=b.parentElement.querySelector('.big');if(v){var r=document.createRange();r.selectNodeContents(v);var s=getSelection();s.removeAllRanges();s.addRange(r)}b.textContent='Označeno';setTimeout(function(){b.textContent=o},2200)};
    try{navigator.clipboard.writeText(t).then(ok,fb)}catch(e){fb()}
  })});
  var cform=$('#cform');
  if(cform)cform.addEventListener('submit',function(e){
    e.preventDefault();var ok=true;
    [['k-name',function(v){return v.trim().length>1}],['k-email',function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())}]].forEach(function(c){var el=$('#'+c[0]),good=c[1](el.value);el.closest('.field').classList.toggle('err',!good);if(!good&&ok){el.focus();ok=false}});
    if(!ok)return;cform.hidden=true;var d=$('#cdone');d.classList.add('show');d.focus({preventScroll:true});
  });

  /* obří logo v patičce: písmena od bubliny ven */
  $$('#giant .lp').forEach(function(l){var order={lk3:0,la1:0,lk2:1,la2:1,lk1:2,la3:2,la4:3};var k=0;Object.keys(order).forEach(function(c){if(l.classList.contains(c))k=order[c]});l.style.setProperty('--d',(250+k*110)+'ms')});

  /* =========================================================
     START: preloader s animovaným logem
     ========================================================= */
  if(form){step(0);render()}
  teaser();
  var start=(location.hash||'').slice(1);
  show(pages[start]?start:'domu',null,false);
  function finishIntro(){
    if(introDone)return;introDone=true;
    if(current&&current.__pending){current.__pending();current.__pending=null}
    headerState();
  }
  if(reduce||!pl){if(pl)pl.classList.add('gone');finishIntro()}
  else{
    var T=[[80,'s1'],[520,'s2'],[760,'s3'],[1450,'s4']];
    T.forEach(function(t){setTimeout(function(){pl.classList.add(t[1])},t[0])});
    setTimeout(function(){pl.classList.add('out');finishIntro()},2000);
    setTimeout(function(){pl.classList.add('gone')},3100);
  }
  setTimeout(function(){if(!introDone)finishIntro();if(pl)pl.classList.add('out','gone')},4000);
})();
