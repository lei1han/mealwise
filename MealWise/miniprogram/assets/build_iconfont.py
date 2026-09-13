# -*- coding: utf-8 -*-
"""
生成三餐教练小程序 iconfont（xc-icon）：
读取 Font Awesome Free solid 图标 SVG（填充轮廓，viewBox 512x512），
通过 fontTools 合成单文件 TTF，码位从 U+E001 起（PUA 私有区）。
源：assets/icons-src/fa-*.svg + paper-plane.svg
产物：assets/fonts/iconfont.ttf
"""
import base64
import os
import re

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.svgLib.path import parse_path

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "icons-src")
OUT_DIR = os.path.join(BASE, "fonts")
os.makedirs(OUT_DIR, exist_ok=True)

EM = 1000
# FA 图标 viewBox 0 0 512 512；等比例缩放到 EM*0.8，并水平/垂直居中于 em，
# 避免宽字形（如 scale 天平、send 纸飞机）超出字宽被裁剪
S = EM / 512.0
FILL_RATIO = 0.8
TRANSFORM = (S * FILL_RATIO, 0, 0, -S * FILL_RATIO, EM * 0.1, EM * 0.9)

# (码位, 字形名, 源文件名) —— 字形名同时用作 .icon-<name> 类名
ICONS = [
    (0xE001, "more", "fa-ellipsis.svg"),
    (0xE002, "bell", "fa-bell.svg"),
    (0xE003, "chart", "fa-chart-simple.svg"),
    (0xE004, "target", "fa-bullseye.svg"),
    (0xE005, "activity", "fa-heart-pulse.svg"),
    (0xE006, "user", "fa-user.svg"),
    (0xE007, "chevron-up", "fa-chevron-up.svg"),
    (0xE008, "chevron-down", "fa-chevron-down.svg"),
    (0xE009, "grid", "fa-table-cells.svg"),
    (0xE00A, "keyboard", "fa-keyboard.svg"),
    (0xE00B, "send", "paper-plane.svg"),
    (0xE00C, "flame", "fa-fire.svg"),
    (0xE00D, "scale", "fa-scale-balanced.svg"),
    (0xE00E, "info", "fa-circle-info.svg"),
    (0xE00F, "file", "fa-file-lines.svg"),
    (0xE010, "chevron-right", "fa-chevron-right.svg"),
    (0xE011, "chevron-left", "fa-chevron-left.svg"),
    (0xE012, "camera", "fa-camera.svg"),
    (0xE013, "calendar", "fa-calendar.svg"),
    (0xE014, "ruler", "fa-ruler.svg"),
    (0xE015, "plus", "fa-plus.svg"),
    (0xE016, "close", "fa-xmark.svg"),
]


def load_paths(svg_path):
    """提取 SVG 中所有 <path d="..."> 的路径描述"""
    with open(svg_path, "r", encoding="utf-8") as f:
        content = f.read()
    return re.findall(r'<path[^>]*\bd="([^"]+)"', content)


def build_glyph(svg_path, transform):
    """把 SVG 路径重放到 TTGlyphPen（三次贝塞尔转二次），返回 Glyph"""
    pen = TTGlyphPen(None)
    # Cu2QuPen 把三次曲线转换为 TrueType 二次曲线
    qpen = Cu2QuPen(pen, max_err=1.0)
    tpen = TransformPen(qpen, transform)
    for d in load_paths(svg_path):
        parse_path(d, tpen)
    return pen.glyph()


def main():
    glyph_order = [".notdef"] + [name for _, name, _ in ICONS]
    glyphs = {name: build_glyph(os.path.join(SRC, fname), TRANSFORM)
              for _, name, fname in ICONS}
    # .notdef 给一个空字形，避免缺字形
    from fontTools.ttLib.tables._g_l_y_f import Glyph
    glyphs[".notdef"] = Glyph()

    char_map = {cp: name for cp, name, _ in ICONS}

    fb = FontBuilder(EM, isTTF=True)
    fb.setupGlyphOrder(glyph_order)
    fb.setupCharacterMap(char_map)
    fb.setupGlyf(glyphs)
    metrics = {name: (EM, 0) for name in glyph_order}  # 方形字形，字宽 = EM
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=800, descent=-200)
    fb.setupNameTable({
        "familyName": "xc-icon",
        "styleName": "Regular",
        "uniqueFontIdentifier": "xc-icon:1.0",
        "fullName": "xc-icon",
        "psName": "XcIcon-Regular",
        "version": "1.0",
    })
    fb.setupOS2(sTypoAscender=800, sTypoDescender=-200, usWinAscent=1000, usWinDescent=0)
    fb.setupPost()
    out_path = os.path.join(OUT_DIR, "iconfont.ttf")
    fb.save(out_path)
    print("SAVED:", out_path)
    print("GLYPHS:", len(glyph_order))

    # ---- 同步生成 base64 模块与 app.wxss 的 @font-face（跨端加载用） ----
    b64 = base64.b64encode(open(out_path, "rb").read()).decode("ascii")

    js_path = os.path.join(OUT_DIR, "iconfont-base64.js")
    js_content = (
        "/**\n"
        " * 图标字体 xc-icon 的 base64（由 assets/fonts/iconfont.ttf 生成）\n"
        " * 真机上 @font-face 无法直接加载包内字体文件，需用 data URI 方式，\n"
        " * 由 app.js 通过 wx.loadFontFace 全局加载，跨 iOS / Android。\n"
        " * 重新生成：python -B assets/build_iconfont.py\n"
        " */\n"
        "module.exports = '" + b64 + "';\n"
    )
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(js_content)
    print("SAVED:", js_path)

    app_wxss = os.path.join(BASE, "..", "app.wxss")
    with open(app_wxss, "r", encoding="utf-8") as f:
        css = f.read()
    pattern = r'(data:font/truetype;charset=utf-8;base64,)[A-Za-z0-9+/=]+'
    if re.search(pattern, css):
        css = re.sub(pattern, r'\g<1>' + b64, css, count=1)
        with open(app_wxss, "w", encoding="utf-8") as f:
            f.write(css)
        print("UPDATED:", app_wxss)
    else:
        raise SystemExit("ERROR: app.wxss 未找到 @font-face data URI，请先手动注入")


if __name__ == "__main__":
    main()
