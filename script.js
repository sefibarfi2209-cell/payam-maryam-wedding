/* ================================================================ */
/* دعوتنامه عروسی — منطق بهینه‌شده                                   */
/* ================================================================ */

const video         = document.getElementById("mainVideo");
const soundToggle   = document.getElementById("soundToggle");
const revealCardEl  = document.getElementById("revealCard");
const pullCardEl    = document.getElementById("pullCard");
const controlBarEl  = document.getElementById("controlBar");


/* ====================================== */
/* آیکون‌های SVG (در همه‌ی دستگاه‌ها یک شکل) */
/* ====================================== */

const ICON_PLAY = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 8 5.5z"/></svg>';

const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="6" y="5" width="4.5" height="14" rx="1.2"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.2"/></svg>';

const ICON_VOL_ON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';

const ICON_VOL_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';


/* ============================================== */
/* پیش‌بارگذاری تصویر کارت                          */
/* (تا وسط انیمیشن منتظر decode نمونیم)            */
/* ============================================== */

const coverPreloader = new Image();
coverPreloader.src = "cover.png";


/* ============================================== */
/* کارت نهایی:                                     */
/* سایز ثابت بزرگ + حرکت فقط با transform          */
/* ============================================== */

/* محاسبه‌ی سایز بزرگ و جای پایه‌ی کارت (مرکز صفحه) */
function bigCardLayout() {

    const maxH = window.innerHeight * 0.76;
    const maxW = (window.innerWidth * 0.86) * (16 / 9);

    const h = Math.min(maxH, maxW);
    const w = h * (9 / 16);

    const baseX = (window.innerWidth  - w) / 2;
    const baseY = (window.innerHeight - h) / 2;

    revealCardEl.style.width  = w + "px";
    revealCardEl.style.height = h + "px";
    revealCardEl.style.left   = baseX + "px";
    revealCardEl.style.top    = baseY + "px";

    return { w: w, h: h, baseX: baseX, baseY: baseY };
}

/* جای‌گذاری اولیه (کارت نامرئی است) */
bigCardLayout();
revealCardEl.style.transform = "translate(0px, 0px) scale(1)";


/* جایگزینی کارت پاکت با کارت بزرگ — بدون پرش:
   کارت بزرگ دقیقاً روی مکان فعلی کارت پاکت scale/translate می‌شود
   و بعد با انیمیشن GPU به مرکز صفحه می‌رود */
function swapToBigCard() {

    const big = bigCardLayout();

    const r = pullCardEl.getBoundingClientRect();

    const s  = r.width / big.w;
    const tx = (r.left + r.width  / 2) - (big.baseX + big.w / 2);
    const ty = (r.top  + r.height / 2) - (big.baseY + big.h / 2);

    /* حالت شروع: هم‌مکان و هم‌سایز کارت پاکت — بدون انیمیشن */
    revealCardEl.classList.add("no-anim");
    revealCardEl.style.transform =
        "translate(" + tx + "px, " + ty + "px) scale(" + s + ")";
    void revealCardEl.offsetWidth;   /* reflow */
    revealCardEl.classList.remove("no-anim");

    /* انیمیشن به مرکز صفحه (فقط transform + opacity) */
    revealCardEl.style.transform = "translate(0px, 0px) scale(1)";
    revealCardEl.classList.add("show");

    pullCardEl.style.visibility = "hidden";   /* کارت پاکت جایگزین شد */
}


/* Resize — با rAF محدود می‌شود (throttle) */
let resizeTicking = false;

window.addEventListener("resize", function() {

    if (resizeTicking) return;
    resizeTicking = true;

    requestAnimationFrame(function() {

        resizeTicking = false;

        if (revealCardEl.classList.contains("show")) {

            revealCardEl.classList.add("no-anim");
            bigCardLayout();
            revealCardEl.style.transform = "translate(0px, 0px) scale(1)";
            void revealCardEl.offsetWidth;
            revealCardEl.classList.remove("no-anim");
        }

    });

}, { passive: true });


/* ====================================== */
/* چرخش پاکت از پشت به جلو (بعد از ۲ ثانیه مکث) */
/* ====================================== */

const envelopeFlipInner = document.getElementById("envelopeFlipInner");
const envelopeHint = document.getElementById("envelopeHint");

setTimeout(function() {

    envelopeFlipInner.classList.add("flipped");

    setTimeout(function() {
        envelopeHint.classList.add("show");
    }, 1100);

}, 2000); /* ۲ ثانیه مکث روی نمای پشت */


/* تلاش برای پخش با صدا */
function tryUnmutedAutoplay() {

    if (!video.paused) {

        video.muted = false;
        soundToggle.style.display = "none";

        setTimeout(function() {
            if (video.paused) {
                video.muted = true;
                video.play().catch(function() {});
                soundToggle.style.display = "flex";
                soundToggle.innerHTML = ICON_VOL_OFF;
            }
        }, 250);

        return;
    }

    video.muted = false;

    const playPromise = video.play();

    if (playPromise !== undefined) {

        playPromise
            .then(function() {
                soundToggle.style.display = "none";
            })
            .catch(function() {
                video.muted = true;
                video.play().catch(function() {});
                soundToggle.innerHTML = ICON_VOL_OFF;
            });
    }
}


/* ====================== */
/* منطق باز شدن پاکت‌نامه */
/* ====================== */

const introScreen   = document.getElementById("introScreen");
const envelopeScene = document.getElementById("envelopeScene");
const envelopeEl    = document.getElementById("envelope");
const mainContent   = document.getElementById("mainContent");

let envelopeOpened = false;

function openEnvelope() {

    if (envelopeOpened) return;
    envelopeOpened = true;

    video.muted = true;
    const startPlay = video.play();
    if (startPlay !== undefined) {
        startPlay.catch(function() {});
    }

    /* مرحله ۱: در باز می‌شود (انیمیشن‌ها در CSS با تأخیر اجرا می‌شوند) */
    envelopeEl.classList.add("open");
    envelopeScene.classList.add("opened");

    /* مرحله ۲: کارت کامل بیرون آمده → جایگزینی پیکسل‌به‌پیکسل + بزرگ شدن */
    setTimeout(function() {
        swapToBigCard();
    }, 2200);

    /* مرحله ۳: محو صحنه + محو کارت بزرگ + شروع ویدیو */
    setTimeout(function() {

        video.currentTime = 0;

        introScreen.classList.add("fade-out");

        revealCardEl.classList.remove("show");   /* کارت بزرگ محو می‌شود */

        mainContent.classList.add("visible");
        controlBarEl.classList.add("visible");

        tryUnmutedAutoplay();

    }, 3300);

    /* مرحله ۴: حذف کامل از DOM */
    setTimeout(function() {
        introScreen.style.display = "none";
        revealCardEl.style.display = "none";
    }, 4000);
}


function toggleSound() {

    if (video.muted) {

        video.muted = false;
        video.play();
        soundToggle.innerHTML = ICON_VOL_ON;

    } else {

        video.muted = true;
        soundToggle.innerHTML = ICON_VOL_OFF;

    }

}


/* ====================== */
/* پلی/پاز و بزرگ‌نمایی */
/* ====================== */

const playPauseBtn   = document.getElementById("playPauseBtn");
const videoContainer = document.getElementById("videoContainer");
const expandCloseBtn = document.getElementById("expandCloseBtn");

function togglePlayPause() {

    if (video.paused) {
        video.play().catch(function() {});
    } else {
        video.pause();
    }

}

video.addEventListener("play", function() {
    playPauseBtn.innerHTML = ICON_PAUSE;
});

video.addEventListener("pause", function() {
    playPauseBtn.innerHTML = ICON_PLAY;
});


function toggleExpand() {

    const isExpanded = videoContainer.classList.toggle("expanded");

    expandCloseBtn.classList.toggle("show", isExpanded);

}


function openInfo() {

    document
        .getElementById("infoOverlay")
        .classList.add("active");

    document.body.style.overflow = "hidden";

}


function closeInfo() {

    document
        .getElementById("infoOverlay")
        .classList.remove("active");

    document.body.style.overflow = "";

}


function closeOutside(event) {

    if (event.target.id === "infoOverlay") {

        closeInfo();

    }

}


document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {

            closeInfo();

        }

    }
);