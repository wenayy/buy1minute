import{i as e}from"./security-Cig8qzkp.js";import{env as t}from"cloudflare:workers";async function n(){let n=t.DB;if(!n)return Response.json({owners:[]});try{let t=(await n.prepare(`
        SELECT om.minute_index, o.purchased_at, o.purchase_price_cents,
          p.id, p.name, p.website_url, p.tagline, p.description, p.category, p.accent_color, p.social_handle,
          COALESCE((SELECT COUNT(*) FROM analytics_events ae WHERE ae.minute_index = om.minute_index AND ae.event_type = 'outbound_click'), 0) AS outbound_clicks
        FROM ownership_minutes om
        JOIN ownerships o ON o.id = om.ownership_id AND o.active = 1
        JOIN products p ON p.id = o.product_id
        WHERE om.active = 1 AND p.disabled_at IS NULL
        ORDER BY om.minute_index
      `).all()).results.map(t=>{let n=e(t.website_url).url??t.website_url;return{minuteIndex:t.minute_index,product:{id:t.id,name:t.name,shortName:t.name.split(/\s+/).map(e=>e[0]).join(``).slice(0,2).toUpperCase(),websiteUrl:n,tagline:t.tagline,description:t.description,category:t.category??`Other`,accentColor:t.accent_color??`#ff4e24`,visualVariant:`signal`,xHandle:t.social_handle??void 0},ownedSince:t.purchased_at,purchasePriceCents:t.purchase_price_cents,pageViews:0,takeoverImpressions:0,outboundClicks:Number(t.outbound_clicks??0)}});return Response.json({owners:t},{headers:{"Cache-Control":`public, s-maxage=5, stale-while-revalidate=10`}})}catch{return Response.json({owners:[]})}}export{n as GET};