#!/bin/sh
# ============================================================
#  رقمُ النسخة: يُشتقّ ولا يُكتب
# ============================================================
#  رقمٌ أكتبه بيدي يَكذب عند أوّل سهو: يُنشَر بناءٌ ويبقى الرقمُ على حاله،
#  فيُطمئنُّ القارئُ إلى ما لم يصله. فيُحسب من عدد الإيداعات + 1 — وهو عددُ
#  الإيداع الذي سيَحمله هذا التغيير، فيستوي المكتوبُ مع الواقع فور الإيداع.
#  يُشغَّل قبل كلّ إيداعٍ يُنشَر.
cd "$(dirname "$0")" || exit 1
N=$(( $(git rev-list --count HEAD) + 1 ))
printf 'window.AC_VER = %s;\n' "$N" > shared/version.js
echo "ver $N"

# ============================================================
#  النسخةُ المضغوطة: ‎app.min.js‎ و‎styles.min.css‎ (ثلثُ الحجم وأقلّ)
# ============================================================
#  تُبنى من الأصل نفسِه بـ‎esbuild‎ (يحذف المسافاتِ والتعليقاتِ ويقصّر الأسماءَ الداخليّة،
#  والشيفرةُ هي هي). وفي رأس كلٍّ رقمُ النسخة التي بُني لها، فإن أُودع ‎version.js‎ دونهما
#  رأت الصفحةُ الاختلافَ فحمّلت الأصل. وإن تعذّر البناءُ بقي ‎AC_MINV = 0‎ = الأصل.
#  والأصلُ هو ما يُعدَّل دائمًا — والمضغوطُ لا يُمسّ باليد.
M=0
ES="npx --yes esbuild@0.20.2"
if $ES --version >/dev/null 2>&1 \
   && $ES platform/app.js --minify --charset=utf8 --log-level=error > platform/app.min.js.tmp \
   && $ES shared/styles.css --minify --charset=utf8 --log-level=error > shared/styles.min.css.tmp; then
  { printf 'if(window.AC_VER!==%s)throw new Error("app.min.js: built for %s");window.AC_MINOK=1;\n' "$N" "$N"; cat platform/app.min.js.tmp; } > platform/app.min.js
  { cat shared/styles.min.css.tmp; printf ':root{--ac-min:%s}\n' "$N"; } > shared/styles.min.css
  M=$N
  echo "min app $(wc -c < platform/app.js) -> $(wc -c < platform/app.min.js) · css $(wc -c < shared/styles.css) -> $(wc -c < shared/styles.min.css)"
else
  echo "min: تعذّر البناء — يُخدم الأصل"
fi
rm -f platform/app.min.js.tmp shared/styles.min.css.tmp
sed -i "s/window\.AC_MINV = [0-9]*;/window.AC_MINV = $M;/" Almaslakh/index.html platform/index.html
git add shared/version.js Almaslakh/index.html platform/index.html
[ "$M" != 0 ] && git add platform/app.min.js shared/styles.min.css
exit 0
