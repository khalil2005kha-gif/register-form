import requests

# 1. جلب البيانات من جدول البيانات (عبر رابط Apps Script الخاص بك)
SCRIPT_URL = "https://script.google.com/macros/s/AKfycbdy9wxOzyGxy91XL4qUvPM6ktTNwrg1STzYZFa4IPYi0-Qh_Bwi53Iz13bwob-L0jK/exec"
get_url = f"{SCRIPT_URL}?action=get_prices"

print("جاري جلب البيانات من جدول جوجل...")
try:
    res = requests.get(get_url)
    json_data = res.json()
    
    if json_data.get("status") == "success":
        data = json_data.get("data", [])
        print(f"تم جلب {len(data)} باقة بنجاح!")
        
        # 2. إرسال البيانات إلى النظام الآخر عبر API (مثال للتوضيح)
        api_url = "https://api.example.com/data"
        payload = {"data": data}
        
        print(f"جاري إرسال البيانات إلى: {api_url}...")
        # يمكنك تفعيل السطرين بالأسفل عند ربطه بالـ API الفعلي الخاص بك
        # response = requests.post(api_url, json=payload)
        # print("حالة الاستجابة:", response.status_code)
        
    else:
        print("خطأ في استجابة الخادم:", json_data)
except Exception as e:
    print("حدث خطأ أثناء الاتصال:", e)
