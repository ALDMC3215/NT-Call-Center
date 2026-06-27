export async function fetchCourseDataDynamic(url: string) {
  try {
    // We use allorigins.win to bypass CORS restrictions in the browser.
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('Proxy network response was not ok');
    
    const data = await res.json();
    const html = data.contents;
    
    if (!html) throw new Error('Empty HTML contents from proxy');

    // Extract Title
    let title = "";
    const titleMatch = html.match(/<h1[^>]*title-page[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<h1[^>]*product_title[^>]*>([\s\S]*?)<\/h1>/i);
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim().replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    }

    // Extract Thumbnail
    let thumbnail = "";
    const imgMatch = html.match(/<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]+)"/i);
    if (imgMatch) {
      thumbnail = imgMatch[1];
    }

    // Extract Prices
    let price = "";
    let originalPrice = "";

    // WooCommerce often puts original price in <del> and current in <ins>
    const delMatch = html.match(/<del[^>]*>([\s\S]*?)<\/del>/i);
    const insMatch = html.match(/<ins[^>]*>([\s\S]*?)<\/ins>/i);

    const extractPrice = (block: string) => {
      const pMatch = block.match(/<bdi>([0-9,&#;]+)/i) || block.match(/([0-9,]+)\s*<span/i);
      return pMatch ? pMatch[1].replace(/&#[0-9]+;/g, '').replace(/,/g, ',') : "";
    };

    if (delMatch && insMatch) {
      originalPrice = extractPrice(delMatch[1]);
      price = extractPrice(insMatch[1]);
    } else {
      // Just a single price
      const priceMatch = html.match(/<bdi>([0-9,]+)&nbsp;<span class="woocommerce-Price-currencySymbol">/i) || html.match(/class="woocommerce-Price-amount amount"><bdi>([0-9,]+)/i);
      if (priceMatch) {
        price = priceMatch[1];
      }
    }

    if (price) price += " تومان";
    if (originalPrice) originalPrice += " تومان";

    // Extract Description
    let fullDescription = "";
    const descMatch = html.match(/<div class="woocommerce-product-details__short-description">([\s\S]*?)<\/div>/i);
    if (descMatch) {
      fullDescription = descMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ').substring(0, 500);
      if (fullDescription.length >= 500) fullDescription += '...';
    }

    // Extract Sections
    const sections: {title: string, items: string[]}[] = [];
    const tabMatch = html.match(/<div class="woocommerce-Tabs-panel[^>]+id="tab-description"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i) || html.match(/<div class="elementor-widget-container">([\s\S]*?)<\/div>/i);
    if (tabMatch) {
        const tabContent = tabMatch[1];
        const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let liMatch;
        const items = [];
        while((liMatch = liRegex.exec(tabContent)) !== null) {
            const txt = liMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
            if (txt && txt.length > 3) {
              items.push(txt);
            }
        }
        if (items.length > 0) {
            sections.push({ title: "سرفصل‌ها و توضیحات", items: items.slice(0, 15) });
        }
    }

    // Extract Schedules (Groups & Class Hours)
    const schedules: string[] = [];
    const optionRegex = /<option value="([^"]+)"[^>]*>([^<]+)<\/option>/gi;
    let optionMatch;
    while((optionMatch = optionRegex.exec(html)) !== null) {
      const val = optionMatch[1].trim();
      const label = optionMatch[2].trim().replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
      if (val !== '' && !label.includes('گزینه') && !label.includes('Choose')) {
        if (label.includes('گروه') || label.includes('شنبه') || label.match(/[0-9]{2}/)) {
          schedules.push(label);
        }
      }
    }

    // Try to find metadata like Duration, Pre-requisite
    const metadata: string[] = [];
    const metaRegex = /<tr class="woocommerce-product-attributes-item[^>]*>[\s\S]*?<th[^>]*>([\s\S]*?)<\/th>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi;
    let metaMatch;
    while((metaMatch = metaRegex.exec(html)) !== null) {
        const key = metaMatch[1].replace(/<[^>]+>/g, '').trim();
        const val = metaMatch[2].replace(/<[^>]+>/g, '').trim();
        if (key && val) {
            metadata.push(`${key}: ${val}`);
        }
    }

    return {
      title,
      price,
      originalPrice,
      thumbnail,
      fullDescription,
      sections,
      schedules,
      metadata
    };
  } catch (error) {
    console.error(`Failed to fetch dynamic data for ${url}:`, error);
    return null;
  }
}
