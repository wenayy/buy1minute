import{i as e}from"./security-Cig8qzkp.js";import{env as t}from"cloudflare:workers";async function n(t,n){if(!t)return null;try{let r=await t.prepare(`
        SELECT om.minute_index, o.purchased_at, o.purchase_price_cents,
          p.id, p.name, p.website_url, p.tagline, p.description, p.category, p.accent_color, p.social_handle,
          COALESCE((SELECT COUNT(*) FROM analytics_events ae WHERE ae.minute_index = om.minute_index AND ae.event_type = 'outbound_click'), 0) AS outbound_clicks
        FROM ownership_minutes om
        JOIN ownerships o ON o.id = om.ownership_id AND o.active = 1
        LEFT JOIN products p ON p.id = o.product_id AND p.disabled_at IS NULL
        WHERE om.minute_index = ? AND om.active = 1
        LIMIT 1
      `).bind(n).first();if(!r)return null;if(!r.id||!r.name||!r.website_url||!r.tagline||!r.description)return{bidCents:r.purchase_price_cents,owner:null};let i=e(r.website_url).url??r.website_url,a={id:r.id,name:r.name,shortName:r.name.split(/\s+/).map(e=>e[0]).join(``).slice(0,2).toUpperCase(),websiteUrl:i,tagline:r.tagline,description:r.description,category:r.category??`Other`,accentColor:r.accent_color??`#ff4e24`,visualVariant:`signal`,xHandle:r.social_handle??void 0};return{bidCents:r.purchase_price_cents,owner:{minuteIndex:n,product:a,ownedSince:r.purchased_at,purchasePriceCents:r.purchase_price_cents,pageViews:0,takeoverImpressions:0,outboundClicks:Number(r.outbound_clicks??0)}}}catch{return null}}function r(){return t.DB}export{n,r as t};