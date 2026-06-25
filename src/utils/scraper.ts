export async function fetchCourseDataDynamic(url: string) {
  try {
    // We use allorigins.win to bypass CORS restrictions in the browser.
    // Note: The response is JSON with a 'contents' field holding the HTML.
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('Proxy network response was not ok');
    
    const data = await res.json();
    const html = data.contents;
    
    if (!html) throw new Error('Empty HTML contents from proxy');

    // Extract Price
    let price = "نامشخص";
    const priceMatch = html.match(/<bdi>([0-9,]+)&nbsp;<span class="woocommerce-Price-currencySymbol">/);
    if (priceMatch) {
      price = priceMatch[1] + " تومان";
    }

    // Extract Description
    let fullDescription = "توضیحات کامل در سایت موجود است.";
    const descMatch = html.match(/<div class="woocommerce-product-details__short-description">([\s\S]*?)<\/div>/);
    if (descMatch) {
      fullDescription = descMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 500) + '...';
    }

    // Extract Sections
    const sections = [
      { title: "سرفصل‌های اصلی", items: ["برای مشاهده سرفصل‌های کامل به وبسایت مراجعه کنید."] }
    ];
    
    const tabMatch = html.match(/<div class="woocommerce-Tabs-panel[^>]+id="tab-description"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
    if (tabMatch) {
        const tabContent = tabMatch[1];
        const liRegex = /<li>(.*?)<\/li>/g;
        let liMatch;
        const items = [];
        while((liMatch = liRegex.exec(tabContent)) !== null) {
            items.push(liMatch[1].replace(/<[^>]+>/g, '').trim());
        }
        if (items.length > 0) {
            sections[0].items = items.slice(0, 10);
        }
    }

    // Extract Schedules (Groups & Class Hours)
    // WooCommerce variables usually exist as <option value="...">Label</option>
    // We'll extract the labels of these options. We skip empty values like "گزینه‌ای انتخاب کنید".
    const schedules: string[] = [];
    const optionRegex = /<option value="([^"]+)"[^>]*>([^<]+)<\/option>/g;
    let optionMatch;
    while((optionMatch = optionRegex.exec(html)) !== null) {
      const val = optionMatch[1].trim();
      const label = optionMatch[2].trim();
      // Skip placeholders
      if (val !== '' && !label.includes('گزینه') && !label.includes('Choose')) {
        // Filter for strings that look like schedule strings (contain days, times, or 'گروه')
        if (label.includes('گروه') || label.includes('شنبه') || label.match(/[0-9]{2}/)) {
          schedules.push(label);
        }
      }
    }

    return { price, fullDescription, sections, schedules };
  } catch (error) {
    console.error(`Failed to fetch dynamic data for ${url}:`, error);
    return null;
  }
}
