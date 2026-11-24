// @ts-nocheck
/* eslint-disable */
// Delivered by Originkit Â· stack: nextjs
"use client";

const RenderTarget = {
  current: () => "preview",
  hasRestrictions: () => false,
  canvas: "canvas",
  export: "export",
  preview: "preview",
  thumbnail: "thumbnail",
};

// Delivered by Originkit Â· stack: framer
// Paste into a Framer code component. Property controls included.
import * as React from "react"
import { useEffect, useRef, useState } from "react"
/** Tuning values. Stripped at publish; the tuned values are baked in here. */
const ADVANCED_DEFAULTS = {
    hover: 50,
    grain: 0,
    vignette: 0,
    autoPlay: true,
    cycleMs: 6000,
    holdMs: 1600,
    flipStiffness: 60,
    flipDamping: 16,
    swingStiffness: 48,
    swingDamping: 20,
    swingKick: 70,
    idleSway: 25,
    restAngle: 1,
    tiltMax: 12,
    tiltStiffness: 170,
    tiltDamping: 22,
    perspective: 1000,
    sheenOpacity: 45,
    glare: 35,
    lineY: 27,
    lineWidth: 70,
    lineSag: 14,
    stringLength: 60,
    wireColor: "#9A9DA0",
    cardRadius: 14,
    shadowOpacity: 8,
    skyTop: "#0B1230",
    skyBottom: "#2E4A6E",
    textColor: "#1E1B22",
    mutedColor: "#6A6670",
    holoMint: "#CFF1E3",
    holoBlue: "#C6DDF6",
    holoPink: "#EFC6E9",
    holoYellow: "#F1EEC0",
}

/** Text on the holographic back, plus the illustrator credit printed on the front. */
const BACK_DEFAULTS = {
    setName: "Northern Set",
    edition: "1st Edition",
    rarityLabel: "Ultra Rare",
    flavour: "Seen only on the coldest nights, where the whole sky burns green.",
    illustrator: "M. Rossi",
}

const DEFAULT_STATS = [
    { label: "Speed", value: 82 },
    { label: "Power", value: 64 },
    { label: "Spirit", value: 91 },
]

// ââ moved controls (builder) ââ
/**
 * Controls moved in the builder: into Advanced, out of it, or into groups of
 * their own. The code reads each one where it was first written, so the props
 * are put back in that shape before anything reads them.
 */
const MOVED_CONTROLS: { into: Record<string, string>; out: Record<string, string> } = {"into":{},"out":{"hover":"advanced","illustrator":"back"}}
const GROUP_FALLBACKS: Record<string, any> = { advanced: ADVANCED_DEFAULTS }
function withMovedControls(props: any): any {
    const out = { ...props }
    for (const [k, g] of Object.entries(MOVED_CONTROLS.into)) out[k] = props?.[g]?.[k] ?? GROUP_FALLBACKS[g]?.[k]
    for (const [k, g] of Object.entries(MOVED_CONTROLS.out)) {
        if (out[k] !== undefined) out[g] = { ...(out[g] ?? {}), [k]: out[k] }
    }
    return out
}
// ââ /moved controls ââ

const FONT = `"Inter", "Inter Display", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif`

/** Font row defaults: the card as drawn. Size 15 is the name; line height and alignment are the flavour text. */
const DEFAULT_FONT = {
    fontFamily: "Inter",
    variant: "Regular",
    fontWeight: 400,
    fontStyle: "normal",
    fontSize: 15,
    lineHeight: "1.45em",
    letterSpacing: "0em",
    textAlign: "center",
} as const

const GRAIN_URL = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>")`

const TAU = Math.PI * 2

// The card's frame lines (rim, keyline, rules, window and pill borders) are 2px at half the ink
// of a 1px line. The card always hangs at a
// slight angle, and a 1px line resampled at an angle alternates between one sharp pixel and two
// half-strength ones, so it reads as dashed. A 2px line keeps the same strength at any angle.
const HAIR = 2
// The wire's weight in design px (its ink). Drawn on the HAIR rule: never under 2 screen px,
// fading instead.
const WIRE_W = 1.4

// Card in design units, trading-card proportions (63 Ã 88)
const CARD_W = 260
const CARD_H = 364

// Fixed star field for the default artwork
const STARS = (() => {
    let s = 7
    const rnd = () => {
        s = (s * 16807) % 2147483647
        return s / 2147483647
    }
    return Array.from({ length: 46 }, () => ({ x: rnd() * 236, y: rnd() * 110, r: 0.3 + rnd() * 0.8, o: 0.3 + rnd() * 0.6 }))
})()

/** Default artwork: a wisp of light drifting over a ridge under the aurora. */
function AuroraArt({ id, top, bottom }: { id: string; top: string; bottom: string }) {
    return (
        <svg
            viewBox="0 0 236 170"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            style={{ display: "block", position: "absolute", inset: 0 }}
        >
            <defs>
                <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={top} />
                    <stop offset="1" stopColor={bottom} />
                </linearGradient>
                <linearGradient id={`${id}aur`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#6FF2C2" stopOpacity="0" />
                    <stop offset="0.25" stopColor="#6FF2C2" />
                    <stop offset="0.6" stopColor="#5FB8FF" />
                    <stop offset="1" stopColor="#B98CFF" stopOpacity="0" />
                </linearGradient>
                <radialGradient id={`${id}glow`}>
                    <stop offset="0" stopColor="#FFFFFF" />
                    <stop offset="0.22" stopColor="#D9FFF1" stopOpacity="0.9" />
                    <stop offset="0.55" stopColor="#6FF2C2" stopOpacity="0.28" />
                    <stop offset="1" stopColor="#6FF2C2" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`${id}tail`} x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
                    <stop offset="1" stopColor="#6FF2C2" stopOpacity="0" />
                </linearGradient>
                <filter id={`${id}blur`} x="-20%" y="-50%" width="140%" height="200%">
                    <feGaussianBlur stdDeviation="5" />
                </filter>
            </defs>
            <rect width="236" height="170" fill={`url(#${id}sky)`} />
            {STARS.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={s.o} />
            ))}
            <g filter={`url(#${id}blur)`}>
                <path
                    d="M-10 62 C 40 18, 92 72, 140 34 S 220 26, 250 46"
                    stroke={`url(#${id}aur)`}
                    strokeWidth="20"
                    fill="none"
                    opacity="0.6"
                />
                <path
                    d="M-10 88 C 52 52, 112 96, 172 62 S 232 66, 250 76"
                    stroke={`url(#${id}aur)`}
                    strokeWidth="12"
                    fill="none"
                    opacity="0.4"
                />
            </g>
            <path
                d="M0 130 L28 108 L52 122 L84 94 L112 118 L140 100 L170 124 L198 104 L236 126 L236 170 L0 170 Z"
                fill="#16213F"
            />
            <path
                d="M0 146 L36 128 L66 142 L104 120 L138 140 L176 126 L210 144 L236 134 L236 170 L0 170 Z"
                fill="#0C1328"
            />
            <path d="M152 72 C 128 86, 104 78, 74 100" stroke={`url(#${id}tail)`} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M152 72 C 132 94, 112 92, 92 112" stroke={`url(#${id}tail)`} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
            <circle cx="152" cy="72" r="34" fill={`url(#${id}glow)`} />
            <circle cx="152" cy="72" r="4.5" fill="#FFFFFF" />
            <path d="M184 52 l1.2 3.3 3.3 1.2 -3.3 1.2 -1.2 3.3 -1.2 -3.3 -3.3 -1.2 3.3 -1.2 Z" fill="#FFFFFF" opacity="0.85" />
            <path d="M120 46 l0.8 2.2 2.2 0.8 -2.2 0.8 -0.8 2.2 -0.8 -2.2 -2.2 -0.8 2.2 -0.8 Z" fill="#FFFFFF" opacity="0.6" />
        </svg>
    )
}

/** The set's mark: a diamond around a four-point star. */
function SetGlyph({ size, color }: { size: number; color: string }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block" }}>
            <path d="M12 2 L22 12 L12 22 L2 12 Z" stroke={color} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
            <path d="M12 6.5 L13.3 10.7 L17.5 12 L13.3 13.3 L12 17.5 L10.7 13.3 L6.5 12 L10.7 10.7 Z" fill={color} />
        </svg>
    )
}

/** The large emblem in the middle of the back. */
function Emblem({ size, color }: { size: number; color: string }) {
    return (
        <svg viewBox="-50 -50 100 100" width={size} height={size} style={{ display: "block" }}>
            <circle r="46" stroke={color} strokeWidth="0.8" fill="none" opacity="0.5" />
            <circle r="40" stroke={color} strokeWidth="0.6" fill="none" opacity="0.35" />
            {Array.from({ length: 36 }, (_, i) => (
                <line
                    key={i}
                    x1="0"
                    y1={i % 3 === 0 ? -46 : -44}
                    x2="0"
                    y2="-40"
                    stroke={color}
                    strokeWidth="0.6"
                    opacity="0.45"
                    transform={`rotate(${i * 10})`}
                />
            ))}
            <path d="M0 -32 L32 0 L0 32 L-32 0 Z" stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
            <path d="M0 -24 L24 0 L0 24 L-24 0 Z" stroke={color} strokeWidth="0.6" fill="none" opacity="0.5" />
            <path d="M0 -18 L4.2 -4.2 L18 0 L4.2 4.2 L0 18 L-4.2 4.2 L-18 0 L-4.2 -4.2 Z" fill={color} />
        </svg>
    )
}

/**
 * On-screen scale of the root (canvas zoom, a scaled preview). Kept to 0.1% so it settles:
 * the old 5% steps left the card laid out for 0.40 in a 0.41 tile, and the browser
 * stretched the whole card by the difference, which read as haze.
 */
function measureZoom(el: HTMLElement, setZoom: (z: number) => void) {
    const w = el.offsetWidth
    if (!(w > 0)) return
    const z = Math.round(Math.max(0.2, Math.min(4, el.getBoundingClientRect().width / w)) * 1000) / 1000
    setZoom(z)
}

const srcOf = (image?: string | { src?: string }) => (typeof image === "string" ? image : image?.src) || undefined

/** The user's logo in place of a drawn mark. Contained, so it is never stretched or cut. */
function Logo({ image, size, children }: { image?: string | { src?: string }; size: number; children: React.ReactNode }) {
    const src = srcOf(image)
    const [failed, setFailed] = useState("")
    if (!src || src === failed) return <>{children}</>
    return (
        <img
            src={src}
            alt=""
            draggable={false}
            onError={() => setFailed(src)}
            style={{ display: "block", width: size, height: size, objectFit: "contain" }}
        />
    )
}

/**
 * Holo Flip Badge
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function HoloFlipBadge(props: any) {
    props = withMovedControls(props)
    const {
        background = "#000000",
        cardColor = "#F2F1EC",
        holoTint = "#D8CBF3",
        cardName = "Aurora Wisp",
        cardType = "Spirit Â· Frost",
        logo,
        rarity = 4,
        cardNumber = "042 / 120",
        stats = [{"label":"Speed","value":82},{"label":"Power","value":64},{"label":"Spirit","value":91}],
        image,
        artworkBg = ADVANCED_DEFAULTS.skyTop,
        imageFit = "cover",
        imageSize = 100,
        offsetX = 0,
        offsetY = 0,
        size = 68,
        speed = 50,
        swing = 50,
        font,
        style,
    } = props
    const adv = { ...ADVANCED_DEFAULTS, ...(props.advanced ?? {}) }
    const back = { ...BACK_DEFAULTS, ...(props.back ?? {}) }

    const propsRef = useRef(props)
    propsRef.current = props

    const rootRef = useRef<HTMLDivElement>(null)
    const swingRef = useRef<HTMLDivElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const sheenRef = useRef<HTMLDivElement>(null)
    const glareFrontRef = useRef<HTMLDivElement>(null)
    const holoRef = useRef<HTMLDivElement>(null)
    const glareBackRef = useRef<HTMLDivElement>(null)
    const statsRef = useRef<HTMLDivElement>(null)

    const [box, setBox] = useState({ w: 1200, h: 800 })
    const [zoom, setZoom] = useState(1)

    const rawId = (React as any).useId ? (React as any).useId() : "hfb"
    const uid = String(rawId).replace(/[^a-zA-Z0-9]/g, "")

    const imgSrc = srcOf(image)
    // Which URL has actually loaded. A reset effect on src change ran after a fast (cached or
    // data) load had already fired, hiding the picture for good; comparing URLs needs no reset.
    const [loadedSrc, setLoadedSrc] = useState("")
    const imgOk = !!imgSrc && loadedSrc === imgSrc

    const rt = RenderTarget.current()
    const isStatic = rt === RenderTarget.thumbnail || rt === (RenderTarget as any).export

    // Layout in design units. Size is the share of the room under the line the card takes,
    // string included, so it never hangs out of the frame.
    const cx = box.w / 2
    const lineY = (box.h * adv.lineY) / 100
    const sag = adv.lineSag
    const beadY = lineY + sag
    const room = Math.max(0.1, Math.min((box.h * 0.96 - beadY) / (adv.stringLength + 6 + CARD_H), (box.w * 0.9) / CARD_W))
    // The card is laid out at the size it shows on screen (zoom = the scale a preview or the
    // canvas puts on the root), and the swing undoes that scale. While the card moves, Chrome
    // keeps its 3D faces at their layout size and shrinks them on the GPU every frame; in a 40%
    // preview that 2.5x shrink broke the edges and hairlines into crawling steps. At screen size
    // there is nothing to shrink. px() is in these screen-sized units; root layout stays as it was.
    const k = room * (Math.min(100, Math.max(20, Number.isFinite(size) ? size : 90)) / 100) * zoom
    const px = (v: number) => v * k
    // Whole pixels, so the rim and keyline sit on the pixel grid and draw evenly on every side
    const Wc = Math.round(px(CARD_W))
    const Hc = Math.round(px(CARD_H))
    const stringLen = px(adv.stringLength)
    const cardOffset = stringLen + px(6)
    const lineHalf = (box.w * adv.lineWidth) / 200

    const layoutRef = useRef({ left: 0, top: 0, w: 0, h: 0 })
    layoutRef.current = { left: cx - Wc / zoom / 2, top: beadY + cardOffset / zoom, w: Wc / zoom, h: Hc / zoom }
    const zoomRef = useRef(zoom)
    zoomRef.current = zoom

    const stRef = useRef({
        flip: 0,
        flipV: 0,
        flipT: 0,
        sw: 0,
        swV: 0,
        tx: 0,
        txV: 0,
        ty: 0,
        tyV: 0,
        over: 0,
        autoT: 0,
        idleT: 0,
        wasAuto: false,
        wasOver: false,
        front: true,
        last: -1,
        cursor: "",
        zoomCheck: 0,
    })
    const ptrRef = useRef({ x: -9999, y: -9999, vx: 0, inside: false, down: false, lastMove: -1e9 })

    // Size
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            const w = el.offsetWidth
            const h = el.offsetHeight
            if (w > 0 && h > 0) setBox((b) => (b.w === w && b.h === h ? b : { w, h }))
            measureZoom(el, setZoom)
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Pointer + frame loop
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const st = stRef.current
        const ptr = ptrRef.current
        const mq =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null

        const inCard = (x: number, y: number, pad = 0) => {
            const L = layoutRef.current
            return x >= L.left - pad && x <= L.left + L.w + pad && y >= L.top - pad && y <= L.top + L.h + pad
        }
        const getAdv = () => ({ ...ADVANCED_DEFAULTS, ...(propsRef.current.advanced ?? {}) })
        // flipT counts half turns either way, so an odd count is the back face
        const showingBack = () => Math.round(st.flipT / 180) % 2 !== 0

        // The stat bars fill again each time the front turns back into view
        const replayStats = () => {
            const fills = statsRef.current?.querySelectorAll<HTMLElement>("[data-fill]")
            fills?.forEach((f, i) => {
                f.style.transition = "none"
                f.style.transform = "scaleX(0)"
                void f.offsetWidth
                f.style.transition = `transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1) ${120 + i * 90}ms`
                f.style.transform = ""
            })
        }

        // Pointer in the root's own (unzoomed) pixels, whichever child it lands on
        const local = (e: PointerEvent) => {
            const r = el.getBoundingClientRect()
            const sx = r.width > 0 ? el.offsetWidth / r.width : 1
            const sy = r.height > 0 ? el.offsetHeight / r.height : 1
            return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy }
        }
        const onMove = (e: PointerEvent) => {
            const p = local(e)
            ptr.vx = p.x - ptr.x
            ptr.x = p.x
            ptr.y = p.y
            ptr.inside = true
            ptr.lastMove = performance.now()
        }
        const onDown = (e: PointerEvent) => {
            onMove(e)
            ptr.down = true
            if (inCard(ptr.x, ptr.y)) {
                const a = getAdv()
                const p = propsRef.current
                // Pressing one side pushes that edge away, so the card turns toward the other side
                const L = layoutRef.current
                const sign = ptr.x >= L.left + L.w / 2 ? 1 : -1
                st.flipT += 180 * sign
                st.swV += a.swingKick * ((p.swing ?? 50) / 50) * sign
                if (mq?.matches) {
                    st.flip = st.flipT
                    st.flipV = 0
                }
            }
        }
        const onLeave = () => {
            ptr.inside = false
            ptr.down = false
        }
        const onUp = () => {
            ptr.down = false
        }
        el.addEventListener("pointermove", onMove)
        el.addEventListener("pointerdown", onDown)
        el.addEventListener("pointerleave", onLeave)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("pointercancel", onUp)

        let raf = 0
        // Off screen the loop stops; the observer below restarts it on return.
        let visible = true
        const tick = (now: number) => {
            if (!visible) {
                raf = 0
                return
            }
            raf = requestAnimationFrame(tick)
            const p = propsRef.current
            const a = getAdv()
            let dt = st.last < 0 ? 0 : (now - st.last) / 1000
            st.last = now
            dt = Math.min(Math.max(dt, 0), 1 / 20)
            const sp = Math.max(0, p.speed ?? 50) / 50
            const sdt = dt * sp
            const hov = Math.max(0, a.hover) / 50
            const swAmt = Math.max(0, p.swing ?? 50) / 50
            const reduced = !!mq?.matches
            const L = layoutRef.current
            const ccx = L.left + L.w / 2
            const ccy = L.top + L.h / 2

            st.idleT += sdt

            const pointerOverCard = ptr.inside && inCard(ptr.x, ptr.y, L.w * 0.04)
            const userActive = ptr.inside && (now - ptr.lastMove < 2500 || pointerOverCard || ptr.down)
            const auto = !userActive && a.autoPlay

            let overT = 0
            let u = 0
            let v = 0

            if (auto) {
                if (!st.wasAuto) st.autoT = 0
                const hold = Math.max(0.2, a.holdMs / 1000)
                const e1 = 1.0
                const e2 = e1 + 0.7 + hold
                const T = Math.max(a.cycleMs / 1000, e2 + 1.4)
                let prev = st.autoT
                st.autoT += sdt
                if (st.autoT >= T) {
                    st.autoT -= T
                    prev -= T
                }
                const cross = (t: number) => prev < t && st.autoT >= t
                if (cross(e1) && !showingBack()) {
                    st.swV += a.swingKick * swAmt
                    st.flipT += 180
                }
                if (cross(e2) && showingBack()) {
                    st.swV -= a.swingKick * swAmt
                    st.flipT -= 180
                }
                // A pointer-free hover: shimmer sweeps across the back while it shows
                const s0 = e1 + 0.45
                const s1 = e2 - 0.05
                if (st.autoT > s0 && st.autoT < s1) {
                    const f = (st.autoT - s0) / (s1 - s0)
                    overT = Math.sin(Math.PI * f)
                    u = -0.7 + 1.4 * f
                    v = -0.3 + 0.4 * Math.sin(Math.PI * f)
                }
            } else if (userActive && pointerOverCard) {
                overT = 1
                u = Math.max(-1, Math.min(1, (ptr.x - ccx) / (L.w / 2)))
                v = Math.max(-1, Math.min(1, (ptr.y - ccy) / (L.h / 2)))
                if (!st.wasOver) {
                    const sign = ptr.vx !== 0 ? Math.sign(ptr.vx) : Math.sign(u) || 1
                    st.swV += a.swingKick * 0.4 * hov * swAmt * sign
                }
            }
            st.wasAuto = auto
            st.wasOver = overT > 0.5

            overT *= Math.min(1, hov)

            // Idle sway: never quite still, never a short repeat
            const idle = Math.max(0, a.idleSway) / 10
            const t = st.idleT
            const swayT =
                a.restAngle + idle * swAmt * (0.65 * Math.sin((t * TAU) / 3.3) + 0.35 * Math.sin((t * TAU) / 5.1 + 1.3))
            const yawI = idle * 1.6 * Math.sin((t * TAU) / 4.3 + 0.7)
            const pitchI = idle * 0.5 * Math.sin((t * TAU) / 3.7 + 2.1)
            const tyT = yawI + u * a.tiltMax * hov * overT
            const txT = pitchI - v * a.tiltMax * hov * overT

            // Same-way clicks keep adding turns; drop whole turns so the angle stays small
            const wrap = Math.round(st.flipT / 360) * 360
            if (wrap !== 0) {
                st.flipT -= wrap
                st.flip -= wrap
            }

            if (reduced) {
                st.flip = st.flipT
                st.flipV = 0
                st.sw = a.restAngle
                st.swV = 0
                st.tx = 0
                st.ty = 0
                st.over += (overT - st.over) * (1 - Math.exp(-dt * 8))
            } else {
                const n = Math.max(1, Math.ceil(sdt / (1 / 240)))
                const h = sdt / n
                const fk = a.flipStiffness
                const fc = a.flipDamping
                const sk = a.swingStiffness
                const sc = a.swingDamping / 10
                const tk = a.tiltStiffness
                const tc = a.tiltDamping
                for (let i = 0; i < n; i++) {
                    st.flipV += (-fk * (st.flip - st.flipT) - fc * st.flipV) * h
                    st.flip += st.flipV * h
                    st.swV += (-sk * (st.sw - swayT) - sc * st.swV) * h
                    st.sw += st.swV * h
                    st.txV += (-tk * (st.tx - txT) - tc * st.txV) * h
                    st.tx += st.txV * h
                    st.tyV += (-tk * (st.ty - tyT) - tc * st.tyV) * h
                    st.ty += st.tyV * h
                }
                st.over += (overT - st.over) * (1 - Math.exp(-sdt * 8))
            }

            const front = Math.cos(((st.flip + st.ty) * Math.PI) / 180) > 0
            if (front && !st.front && !reduced) replayStats()
            st.front = front

            // Canvas zoom moves no layout, so no observer sees it: check twice a second
            if (++st.zoomCheck >= 30) {
                st.zoomCheck = 0
                measureZoom(el, setZoom)
            }

            if (swingRef.current)
                swingRef.current.style.transform = `rotate(${st.sw.toFixed(3)}deg) scale(${1 / zoomRef.current})`
            if (cardRef.current)
                cardRef.current.style.transform = `rotateX(${st.tx.toFixed(3)}deg) rotateY(${(st.flip + st.ty).toFixed(3)}deg)`

            const nu = a.tiltMax > 0 ? st.ty / a.tiltMax : 0
            const nv = a.tiltMax > 0 ? st.tx / a.tiltMax : 0
            const fs = Math.sin((st.flip * Math.PI) / 180)
            const drift = 10 * Math.sin(t * 0.9) + 6 * Math.sin(t * 0.53 + 1.1)
            const pos = Math.max(0, Math.min(100, 50 + nu * 35 + fs * 30 + drift))
            const posY = Math.max(0, Math.min(100, 50 - nv * 25 + drift * 0.5))
            const gpos = Math.max(0, Math.min(100, 50 + nu * 45 + fs * 40))

            if (sheenRef.current) {
                sheenRef.current.style.opacity = String((st.over * a.sheenOpacity) / 100)
                sheenRef.current.style.backgroundPosition = `${pos}% ${posY}%`
            }
            if (glareFrontRef.current) {
                glareFrontRef.current.style.opacity = String((st.over * a.glare) / 100)
                glareFrontRef.current.style.backgroundPosition = `${gpos}% ${posY}%`
            }
            if (holoRef.current) holoRef.current.style.backgroundPosition = `${pos}% ${posY}%`
            if (glareBackRef.current) {
                glareBackRef.current.style.opacity = String(((0.35 + 0.65 * st.over) * a.glare) / 100)
                glareBackRef.current.style.backgroundPosition = `${100 - gpos}% ${posY}%`
            }

            const cur = ptr.inside && inCard(ptr.x, ptr.y) ? "pointer" : "default"
            if (cur !== st.cursor) {
                st.cursor = cur
                el.style.cursor = cur
            }
        }
        const io = isStatic
            ? null
            : new IntersectionObserver(([e]) => {
                  visible = e.isIntersecting
                  if (visible && !raf) {
                      st.last = -1
                      raf = requestAnimationFrame(tick)
                  }
              })
        io?.observe(el)
        if (!isStatic) raf = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(raf)
            io?.disconnect()
            el.removeEventListener("pointermove", onMove)
            el.removeEventListener("pointerdown", onDown)
            el.removeEventListener("pointerleave", onLeave)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
        }
    }, [isStatic])

    const statList: { label: string; value: number }[] = (Array.isArray(stats) ? stats : DEFAULT_STATS)
        .slice(0, 4)
        .map((s: any) => ({ label: String(s?.label ?? ""), value: Math.max(0, Math.min(100, Number(s?.value) || 0)) }))
    const stars = Math.max(0, Math.min(5, Math.round(Number(rarity) || 0)))
    const rowGap = statList.length > 3 ? 17 : 20
    const barH = Math.max(HAIR, Math.round(px(4)))

    // Font: family, weight and style set every line on the card. Size scales the whole type set
    // against the name (15); emphasis lines stay that much bolder than the picked weight, and
    // letter spacing adds to each line's own tracking. Line height and alignment set the flavour.
    const f = { ...DEFAULT_FONT, ...(font ?? {}) }
    const typeScale = Math.max(0.5, Math.min(2, (parseFloat(String(f.fontSize)) || 15) / 15))
    const fontW = Number(f.fontWeight) || 400
    const weight = (lift: number) => Math.min(900, fontW + lift)
    const ls = typeof f.letterSpacing === "number" ? `${f.letterSpacing}px` : String(f.letterSpacing || "0em")
    const track = (own: string) => (parseFloat(ls) ? `calc(${own} + ${ls})` : own)
    const family = f.fontFamily ? `${f.fontFamily}, ${FONT}` : FONT

    const txt = (fs: number, color: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
        position: "absolute",
        fontFamily: family,
        fontSize: px(fs * typeScale),
        fontWeight: fontW,
        fontStyle: f.fontStyle,
        letterSpacing: track("0em"),
        lineHeight: 1.15,
        color,
        whiteSpace: "nowrap",
        margin: 0,
        ...extra,
    })
    const caps: React.CSSProperties = { textTransform: "uppercase", letterSpacing: track("0.1em"), fontWeight: weight(200) }
    const nums: React.CSSProperties = { fontVariantNumeric: "tabular-nums" }

    // Offset names the point the picture is pinned to and grows from, so Offset X -50 sits it
    // flush with the window's left edge and 50 with the right, at any Artwork Size. Offset Y is
    // the library's Y Offset: a share of the crop, 250 the picture's top edge flush with the
    // window's, -250 its bottom, 0 centred.
    const artPin = `${50 + Math.max(-50, Math.min(50, offsetX))}% ${50 - Math.max(-250, Math.min(250, Number(offsetY) || 0)) / 5}%`

    const holoGradient = `linear-gradient(125deg, ${adv.holoPink} 0%, ${adv.holoBlue} 18%, ${adv.holoMint} 34%, #FFFFFF 48%, ${adv.holoYellow} 60%, ${holoTint} 78%, ${adv.holoPink} 100%)`
    const glareGradient = `linear-gradient(115deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 62%)`
    const radius = px(adv.cardRadius)
    const shadow = `0 ${px(12)}px ${px(30)}px rgba(0,0,0,${adv.shadowOpacity / 100}), inset 0 0 0 ${HAIR}px rgba(255,255,255,0.28)`

    const faceBase: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        boxShadow: shadow,
    }
    const rule = (top: number): React.CSSProperties => ({
        position: "absolute",
        left: px(16),
        right: px(16),
        top: px(top),
        height: HAIR,
        background: "rgba(0,0,0,0.05)",
    })
    // Inner keyline a few units in from the edge, like a printed card border
    // Concentric with the card corner, so the margin outside it is the same width all the way round
    const keyInset = Math.round(px(6))
    const keyRadius = Math.max(0, radius - keyInset)
    // Both diagonals, lines px(12) apart, across the box inside the keyline
    const latticePath = (() => {
        const w = Wc - 2 * keyInset
        const h = Hc - 2 * keyInset
        const step = Math.max(4, px(12)) * Math.SQRT2
        let d = ""
        for (let c = step / 2; c < w + h; c += step) {
            d += `M${c.toFixed(2)} 0 L${(c - h).toFixed(2)} ${h}`
            d += `M${(w - c).toFixed(2)} 0 L${(w - c + h).toFixed(2)} ${h}`
        }
        return d
    })()
    const keyline: React.CSSProperties = {
        position: "absolute",
        inset: keyInset,
        borderRadius: keyRadius,
        boxShadow: `inset 0 0 0 ${HAIR}px rgba(0,0,0,0.06)`,
        pointerEvents: "none",
    }

    const x0 = cx - lineHalf
    const x1 = cx + lineHalf
    // One hanging curve from pin to pin, lowest (and level) at the bead. Two near-straight halves
    // meeting in a kink at the bead read as two tilted pipes rather than a wire.
    const cordPath = `M ${x0} ${lineY} Q ${cx} ${lineY + 2 * sag} ${x1} ${lineY}`
    // Wire in screen px, at least HAIR wide: a thinner line on a slight slope alternates sharp and
    // half-strength pixels and breaks into stepped segments. It fades instead, so its ink stays
    // WIRE_W design px, but never under one screen px so a small tile still shows the wire.
    const wireW = Math.max(HAIR, WIRE_W * zoom)
    const wireA = Math.min(1, Math.max(1, WIRE_W * zoom) / wireW)

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 1200,
                minHeight: 800,
                ...style,
                background,
                overflow: "hidden",
                isolation: "isolate",
                userSelect: "none",
                touchAction: "manipulation",
            }}
        >
            {/* Cord across the top with one centre bead */}
            {/* Laid out at the size it shows and scaled back, like the card, so it is drawn at screen resolution */}
            <svg
                width={box.w * zoom}
                height={box.h * zoom}
                viewBox={`0 0 ${box.w} ${box.h}`}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    pointerEvents: "none",
                    transformOrigin: "0 0",
                    transform: zoom === 1 ? undefined : `scale(${1 / zoom})`,
                }}
            >
                <path
                    d={cordPath}
                    stroke={adv.wireColor}
                    strokeWidth={wireW / zoom}
                    strokeOpacity={wireA}
                    fill="none"
                    strokeLinecap="round"
                />
                <circle cx={x0} cy={lineY} r={2.5} fill={adv.wireColor} />
                <circle cx={x1} cy={lineY} r={2.5} fill={adv.wireColor} />
                <circle cx={cx} cy={beadY} r={3.2} fill={adv.wireColor} />
            </svg>

            {/* Swings from the bead: string, clip and card */}
            <div
                ref={swingRef}
                style={{
                    position: "absolute",
                    left: cx,
                    top: beadY,
                    width: 0,
                    height: 0,
                    transformOrigin: "0 0",
                    transform: `rotate(${adv.restAngle}deg) scale(${1 / zoom})`,
                }}
            >
                {/* Runs on under the card: a tilt moves the clip along this line, so the wire always reaches it */}
                <div
                    style={{
                        position: "absolute",
                        left: -wireW / 2,
                        top: 0,
                        width: wireW,
                        height: cardOffset + px(30),
                        background: adv.wireColor,
                        opacity: wireA,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        left: -Wc / 2,
                        top: cardOffset,
                        width: Wc,
                        height: Hc,
                        perspective: adv.perspective * zoom,
                    }}
                >
                    <div
                        ref={cardRef}
                        style={{
                            position: "absolute",
                            inset: 0,
                            transformStyle: "preserve-3d",
                            transformOrigin: "50% 50%",
                        }}
                    >
                        {/* Front: artwork, name, type and stats */}
                        <div style={{ ...faceBase, background: cardColor }}>
                            <div style={keyline} />
                            <div
                                style={txt(15, adv.textColor, {
                                    left: px(16),
                                    top: px(17),
                                    fontWeight: weight(200),
                                    letterSpacing: track("-0.01em"),
                                })}
                            >
                                {cardName}
                            </div>
                            <div
                                style={{
                                    position: "absolute",
                                    right: px(16),
                                    top: px(19),
                                    display: "flex",
                                    gap: px(2),
                                }}
                            >
                                {Array.from({ length: 5 }, (_, i) => (
                                    <svg key={i} viewBox="0 0 12 12" width={px(9)} height={px(9)} style={{ display: "block" }}>
                                        <path
                                            d="M6 0.8 L7.5 4.2 L11.2 4.6 L8.4 7.1 L9.2 10.8 L6 8.9 L2.8 10.8 L3.6 7.1 L0.8 4.6 L4.5 4.2 Z"
                                            fill={i < stars ? adv.textColor : "rgba(0,0,0,0.12)"}
                                        />
                                    </svg>
                                ))}
                            </div>
                            <div
                                style={{
                                    position: "absolute",
                                    left: px(14),
                                    top: px(40),
                                    width: px(232),
                                    height: px(174),
                                    borderRadius: px(8),
                                    overflow: "hidden",
                                    background: artworkBg,
                                    boxShadow: `inset 0 0 0 ${HAIR}px rgba(0,0,0,0.075)`,
                                }}
                            >
                                {!(imgSrc && imgOk) && <AuroraArt id={uid} top={artworkBg} bottom={adv.skyBottom} />}
                                {imgSrc && (
                                    <img
                                        src={imgSrc}
                                        alt=""
                                        draggable={false}
                                        // A picture that finished before React hydrated fires no onLoad: read it here.
                                        ref={(el) => {
                                            if (el && el.complete && el.naturalWidth > 0) setLoadedSrc(imgSrc)
                                        }}
                                        onLoad={() => setLoadedSrc(imgSrc)}
                                        onError={() => setLoadedSrc("")}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: imageFit === "cover" ? "cover" : "contain",
                                            objectPosition: imageFit === "cover" ? artPin : "50% 50%",
                                            transformOrigin: artPin,
                                            transform: `scale(${Math.max(20, Math.min(300, imageSize)) / 100})`,
                                            opacity: imgOk ? 1 : 0,
                                            display: "block",
                                        }}
                                    />
                                )}
                            </div>
                            <div
                                style={{
                                    position: "absolute",
                                    left: px(14),
                                    top: px(222),
                                    width: px(232),
                                    height: px(22),
                                    borderRadius: px(6),
                                    background: "rgba(0,0,0,0.05)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: `0 ${px(8)}px`,
                                    boxSizing: "border-box",
                                }}
                            >
                                <span style={{ ...txt(7.5, adv.textColor, caps), position: "static" }}>{cardType}</span>
                                <Logo image={logo} size={px(14)}>
                                    <SetGlyph size={px(10)} color={adv.textColor} />
                                </Logo>
                            </div>
                            <div ref={statsRef}>
                                {statList.map((s, i) => (
                                    <React.Fragment key={i}>
                                        <div style={txt(7, adv.mutedColor, { left: px(16), top: px(258 + i * rowGap), ...caps })}>
                                            {s.label}
                                        </div>
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: Math.round(px(66)),
                                                // Whole pixels, at least HAIR tall: a fractional bar lands on a
                                                // different sub-pixel per row, so one drew sharp and the next blurred.
                                                top: Math.round(px(262 + i * rowGap) - barH / 2),
                                                width: Math.round(px(150)),
                                                height: barH,
                                                borderRadius: barH / 2,
                                                background: "rgba(0,0,0,0.08)",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                data-fill=""
                                                style={{
                                                    width: `${s.value}%`,
                                                    height: "100%",
                                                    borderRadius: barH / 2,
                                                    background: adv.textColor,
                                                    transformOrigin: "0 50%",
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={txt(8.5, adv.textColor, {
                                                right: px(16),
                                                top: px(256.5 + i * rowGap),
                                                fontWeight: weight(200),
                                                ...nums,
                                            })}
                                        >
                                            {s.value}
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                            <div style={rule(326)} />
                            <div style={txt(7, adv.textColor, { left: px(16), top: px(337), ...caps, ...nums })}>
                                {cardNumber}
                            </div>
                            {back.illustrator && (
                                <div style={txt(7, adv.mutedColor, { right: px(16), top: px(337) })}>
                                    Illus. {back.illustrator}
                                </div>
                            )}
                            <div
                                ref={sheenRef}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: holoGradient,
                                    backgroundSize: "250% 250%",
                                    mixBlendMode: "multiply",
                                    opacity: 0,
                                    pointerEvents: "none",
                                }}
                            />
                            <div
                                ref={glareFrontRef}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: glareGradient,
                                    backgroundSize: "250% 250%",
                                    opacity: 0,
                                    pointerEvents: "none",
                                }}
                            />
                        </div>

                        {/* Back: holographic foil with the set emblem, rarity and flavour text */}
                        <div style={{ ...faceBase, transform: "rotateY(180deg)", background: adv.holoMint }}>
                            <div
                                ref={holoRef}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: holoGradient,
                                    backgroundSize: "250% 250%",
                                    backgroundPosition: "50% 50%",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.06) 100%)",
                                }}
                            />
                            {/* Fine diagonal lattice pressed into the foil, kept inside the keyline so it never
                                runs across it and the margin outside stays clean. Drawn as whole lines in one
                                path: a rotated SVG pattern is a resampled tile and broke the lines into beads,
                                and one path paints its crossings once instead of darkening them into dots. */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: keyInset,
                                    borderRadius: keyRadius,
                                    overflow: "hidden",
                                }}
                            >
                                <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, display: "block" }}>
                                    <path d={latticePath} stroke="rgba(0,0,0,0.07)" strokeWidth={1} fill="none" />
                                </svg>
                            </div>
                            <div style={keyline} />
                            <div style={txt(7, adv.textColor, { left: px(16), top: px(18), ...caps })}>{back.setName}</div>
                            <div style={txt(7, adv.mutedColor, { right: px(16), top: px(18), ...caps })}>{back.edition}</div>
                            <div style={{ position: "absolute", left: px(130 - 54), top: px(60) }}>
                                {/* Back > Logo when set, else the Set Logo, so one upload changes every mark */}
                                <Logo image={srcOf(back.logo) ? back.logo : logo} size={px(108)}>
                                    <div style={{ opacity: 0.85 }}>
                                        <Emblem size={px(108)} color={adv.textColor} />
                                    </div>
                                </Logo>
                            </div>
                            {back.rarityLabel && (
                                <div
                                    style={txt(7.5, adv.textColor, {
                                        left: "50%",
                                        top: px(190),
                                        transform: "translateX(-50%)",
                                        padding: `${px(5)}px ${px(10)}px`,
                                        borderRadius: 999,
                                        boxShadow: `inset 0 0 0 ${HAIR}px rgba(0,0,0,0.11)`,
                                        background: "rgba(255,255,255,0.35)",
                                        ...caps,
                                    })}
                                >
                                    â¦ {back.rarityLabel} â¦
                                </div>
                            )}
                            <div
                                style={txt(10, adv.textColor, {
                                    left: px(30),
                                    top: px(228),
                                    width: px(200),
                                    whiteSpace: "normal",
                                    lineHeight: f.lineHeight,
                                    textAlign: f.textAlign,
                                    fontStyle: "italic",
                                })}
                            >
                                {back.flavour ? `â${back.flavour}â` : null}
                            </div>
                            <div style={rule(306)} />
                            <div
                                style={txt(16, adv.textColor, {
                                    left: px(16),
                                    top: px(318),
                                    fontWeight: weight(100),
                                    letterSpacing: track("-0.01em"),
                                    ...nums,
                                })}
                            >
                                {cardNumber}
                            </div>
                            <div style={txt(6.5, adv.mutedColor, { left: px(16), top: px(340), ...caps })}>Card No.</div>
                            <div style={{ position: "absolute", right: px(16), top: px(320) }}>
                                <Logo image={logo} size={px(24)}>
                                    <SetGlyph size={px(24)} color={adv.textColor} />
                                </Logo>
                            </div>
                            <div
                                ref={glareBackRef}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: glareGradient,
                                    backgroundSize: "250% 250%",
                                    opacity: (0.35 * adv.glare) / 100,
                                    pointerEvents: "none",
                                }}
                            />
                        </div>

                        {/* Metal clip gripping the top edge: one half on each face, inside the card's
                            3D space, so it stays seated however the card tilts or turns */}
                        {["", "rotateY(180deg) "].map((turn) => (
                            <div
                                key={turn}
                                style={{
                                    position: "absolute",
                                    left: Wc / 2 - px(9),
                                    top: -px(9),
                                    width: px(18),
                                    height: px(14),
                                    borderRadius: `${px(9)}px ${px(9)}px ${px(3)}px ${px(3)}px`,
                                    background: "linear-gradient(180deg, #D9DCDF 0%, #9EA3A8 100%)",
                                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                                    transform: `${turn}translateZ(0.5px)`,
                                    backfaceVisibility: "hidden",
                                    WebkitBackfaceVisibility: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: px(4),
                                        width: px(5),
                                        height: px(5),
                                        marginLeft: -px(2.5),
                                        borderRadius: "50%",
                                        background: "#7C8186",
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {adv.grain > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: GRAIN_URL,
                        opacity: (adv.grain / 100) * 0.5,
                        mixBlendMode: "overlay",
                        pointerEvents: "none",
                    }}
                />
            )}
            {adv.vignette > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${adv.vignette / 100}) 100%)`,
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

// Control order arranged in the builder.


