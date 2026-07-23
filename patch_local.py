from pathlib import Path

js_path = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CDfA73H_.js")
css_path = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CaZIvcnB.css")
cfg_path = Path(r"C:\Users\ttfar\dimasclient-fun\site\config.json")

js = js_path.read_text(encoding="utf-8")

# Bypass captcha gate on sign-in (token state var is `l`)
old_login = "if(!l)return r(`error`,`Checking for a bot...`,`To log in, go through a bot check!`);"
new_login = "if(!l)l=`bypass`;"
c1 = js.count(old_login)
js = js.replace(old_login, new_login)

# Bypass captcha gate on sign-up (token state var is `i`)
old_reg = "if(!i)return t(`error`,`Checking for a bot...`,`To log in, go through a bot check!`);"
new_reg = "if(!i)i=`bypass`;"
c2 = js.count(old_reg)
js = js.replace(old_reg, new_reg)

js_path.write_text(js, encoding="utf-8")
print(f"login patches: {c1}, register patches: {c2}")

# Hide captcha widgets
css = css_path.read_text(encoding="utf-8")
marker = "/* captcha-hidden */"
if marker not in css:
    css += "\n" + marker + "\n._formCaptcha_7h1zp_135,.cf-turnstile,[id^=cf-turnstile],iframe[src*='challenges.cloudflare.com']{display:none!important;height:0!important;overflow:hidden!important;}\n"
    css_path.write_text(css, encoding="utf-8")
    print("css captcha hidden")
else:
    print("css already patched")

# Point API to local mock
import json
cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
cfg["ajaxUrl"] = "http://127.0.0.1:8080/ajax/"
cfg["turnStileSiteKey"] = ""
cfg_path.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("config ajaxUrl -> local")
