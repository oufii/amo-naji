const handleSendWhatsApp = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('السلة فارغة!');
    if (!settings.is_delivery_available) return alert('عذراً، التوصيل غير متاح حالياً!');

    // 1. حفظ الطلب في قاعدة البيانات (جدول orders)
    try {
      await supabase.from('orders').insert([
        {
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          location_url: locationUrl || '',
          items: cart,
          food_total: foodTotal,
          delivery_fee: currentDeliveryFee,
          grand_total: grandTotal
        }
      ]);
    } catch (err) {
      console.log('Error saving order:', err);
    }

    // 2. تجهيز رسالة الواتساب وفتحها
    const itemsList = cart.map((item, idx) => `${idx + 1}. ${item.name} × ${item.quantity} = ${(Number(item.price) * item.quantity).toLocaleString()} د.ع`).join('\n');

    let message = `🍔 *طلب جديد من مطعم عمو ناجي* 🍔\n\n` +
      `👤 *الاسم:* ${customerInfo.name}\n` +
      `📞 *الهاتف:* ${customerInfo.phone}\n` +
      `📍 *العنوان:* ${customerInfo.address}\n`;

    if (locationUrl) {
      message += `🗺️ *رابط الموقع:* ${locationUrl}\n`;
    }

    message += `\n🛒 *الوجبات:*\n${itemsList}\n\n` +
      `💵 *مجموع الوجبات:* ${foodTotal.toLocaleString()} د.ع\n` +
      `🚚 *التوصيل:* ${currentDeliveryFee.toLocaleString()} د.ع\n` +
      `💰 *المجموع الكلي:* ${grandTotal.toLocaleString()} د.ع`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/9647722447722?text=${encodedMessage}`, '_blank');
    
    setIsCheckoutOpen(false);
  };
 
