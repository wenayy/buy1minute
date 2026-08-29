import{r as e,t}from"./security-Cig8qzkp.js";import{env as n}from"cloudflare:workers";var r=new Set([`minute_page_view`,`homepage_takeover_impression`,`outbound_click`,`purchase`,`share_clicked`]);async function i(i){try{let a=await i.json().catch(()=>null);if(!a||!a.eventType||!r.has(a.eventType)||!Number.isInteger(a.minuteIndex)||(a.minuteIndex??-1)<0||(a.minuteIndex??1440)>1439)return new Response(null,{status:400});let o=n.DB;if(o){let n=await t(i.headers.get(`cf-connecting-ip`)??i.headers.get(`x-forwarded-for`)),r=e(a.path??``,180),s=new Date().toISOString();if(a.eventType===`homepage_takeover_impression`||a.eventType===`minute_page_view`){let e=new Date(Date.now()-6e4).toISOString();if(await o.prepare(`
            SELECT id FROM analytics_events
            WHERE event_type = ? AND minute_index = ? AND visitor_hash = ? AND occurred_at >= ?
            LIMIT 1
          `).bind(a.eventType,a.minuteIndex,n,e).first())return new Response(null,{status:204})}await o.prepare(`
          INSERT INTO analytics_events (id, event_type, minute_index, visitor_hash, path, occurred_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(),a.eventType,a.minuteIndex,n,r,s).run()}}catch{}return new Response(null,{status:204})}export{i as POST};