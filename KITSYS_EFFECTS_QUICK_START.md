# KitSys Effects - دليل البدء السريع

تم إضافة مؤثرات واتحريكات احترافية من موقع KitSys إلى مشروعك. إليك كيفية استخدامها:

---

## 🚀 المؤثرات المضافة

### 1. FallingSpheres (العناصر الساقطة) ✅ موجودة بالفعل
```tsx
// في HeroSection
<FallingSpheres className="z-[1] opacity-90" count={18} />
```
**ما الجديد:**
- ✨ Motion blur خفيف أثناء السقوط
- ✨ Specular highlights محسّنة
- ✨ Glow halo حول كل عنصر
- ✨ Staggered spawn animation

---

### 2. Scroll-Triggered Animations (تحريكات عند التمرير) ✨ جديدة
```tsx
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function MySection() {
  const ref = useScrollAnimation({ 
    threshold: 0.2,     // عند ظهور 20% من العنصر
    triggerOnce: true   // مرة واحدة فقط
  });
  
  return <div ref={ref} className="scroll-reveal">محتوى</div>;
}
```

**CSS Classes:**
```css
.scroll-reveal {
  /* العنصر يظهر بتدرج من الأسفل */
  opacity: 0;
  transform: translateY(24px) scale(0.98);
}

.scroll-reveal.in-view {
  /* عندما يظهر */
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

---

### 3. Staggered Children Animation (تحريك الأطفال بتدرج) ✨ جديدة
```tsx
<div className="scroll-reveal-stagger">
  <div>عنصر 1</div>  {/* delay: 0ms */}
  <div>عنصر 2</div>  {/* delay: 80ms */}
  <div>عنصر 3</div>  {/* delay: 160ms */}
</div>
```

---

### 4. MarqueeText (نص دوار) ✨ جديدة
```tsx
import MarqueeText from "@/components/MarqueeText";

<MarqueeText speed="normal" pauseOnHover>
  🎯 تحقيق الأهداف · 🚀 الابتكار · 💡 الإبداع
</MarqueeText>
```

**Props:**
- `speed`: "slow" | "normal" | "fast"
- `pauseOnHover`: توقف عند المرور (default: true)

---

### 5. HoverCard (بطاقات محسّنة) ✨ جديدة
```tsx
import HoverCard from "@/components/HoverCard";

<HoverCard className="p-6 rounded-lg bg-card">
  <h3>عنوان</h3>
  <p>محتوى البطاقة</p>
</HoverCard>
```

**التأثيرات:**
- ✨ رفع أثناء المرور (translateY -8px)
- ✨ تكبير طفيف (scale 1.02)
- ✨ توهج ديناميكي يتابع المؤشر
- ✨ ظل محسّن

---

### 6. InteractiveElement (عناصر تفاعلية) ✨ جديدة
```tsx
import InteractiveElement from "@/components/InteractiveElement";

<InteractiveElement hoverLift rippleEffect>
  عنصر تفاعلي
</InteractiveElement>
```

**Props:**
- `hoverLift`: تأثير الرفع عند المرور
- `rippleEffect`: تأثير الموجة عند الضغط

---

### 7. Parallax Scroll Effects (منظور أثناء التمرير) ✨ جديدة
```tsx
import { useParallaxScroll } from "@/hooks/useParallaxScroll";

export function ParallaxSection() {
  const bgRef = useParallaxScroll({ 
    offset: 0.1,      // شدة التأثير (0.05-0.5)
    direction: "up"   // "up" أو "down"
  });
  
  return (
    <div className="relative">
      <div ref={bgRef} className="absolute">خلفية متحركة</div>
      <div className="relative z-10">محتوى في الأمام</div>
    </div>
  );
}
```

---

## 🎨 CSS Classes الجديدة

### Button Effects
```css
.btn-primary:hover {
  /* الآن يرفع بشكل أكثر سلاسة */
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0,0,0,0.22);
}
```

### Text Effects
```css
.reveal-words .word > span {
  /* كلمات تظهر واحدة تلو الأخرى */
  animation: word-rise 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.text-shimmer {
  /* تدرج لوني يتحرك عبر النص */
  animation: shimmer 6s linear infinite;
}

.gradient-text-animated {
  /* نص بتدرج ديناميكي */
  animation: gradient-flow 4s ease infinite;
}
```

### Interactive Classes
```css
.card-lift:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 48px hsl(var(--glow-primary) / 0.18);
}

.line-underline:hover::after {
  /* خط يظهر من اليسار لليمين */
  transform: scaleX(1);
  transform-origin: left;
}

.interactive-btn::before {
  /* تأثير موجة عند الضغط */
  animation: ripple-expand 0.6s ease-out;
}
```

---

## 📚 أمثلة عملية

### مثال 1: قسم كامل بتحريكات
```tsx
import { useScrollAnimation, useScrollAnimationGroup } from "@/hooks/useScrollAnimation";
import HoverCard from "@/components/HoverCard";

export function FeaturedSection() {
  const titleRef = useScrollAnimation({ triggerOnce: true });
  const cardsRef = useScrollAnimationGroup({ triggerOnce: true });
  
  return (
    <section>
      <h2 ref={titleRef} className="scroll-reveal text-3xl mb-8">
        أحدث المشاريع
      </h2>
      
      <div ref={cardsRef} className="scroll-reveal-stagger grid grid-cols-3 gap-6">
        {projects.map(project => (
          <HoverCard key={project.id} className="p-6 bg-card rounded-lg">
            <h3 className="text-lg font-bold">{project.title}</h3>
            <p className="text-muted-foreground">{project.desc}</p>
          </HoverCard>
        ))}
      </div>
    </section>
  );
}
```

### مثال 2: Hero Section محسّنة
```tsx
// في HeroSection.tsx
<section className="relative">
  {/* Background effects */}
  <FallingSpheres count={18} className="z-[1]" />
  
  {/* Main content */}
  <div className="relative z-10">
    <h1 className="reveal-words text-5xl">
      مرحباً بك
    </h1>
    
    <p className="text-lg text-muted-foreground mb-8">
      رحلة احترافية مع التحريكات
    </p>
    
    {/* Marquee text */}
    <MarqueeText speed="normal">
      🎯 جودة عالية · 🚀 أداء ممتاز · 💡 ابتكار
    </MarqueeText>
  </div>
</section>
```

### مثال 3: Cards Grid مع تأثيرات
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item, idx) => (
    <HoverCard 
      key={item.id}
      className="p-6 bg-card rounded-xl border border-border"
      style={{ 
        animationDelay: `${idx * 100}ms`
      }}
    >
      <InteractiveElement rippleEffect>
        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
        <p className="text-muted-foreground">{item.description}</p>
      </InteractiveElement>
    </HoverCard>
  ))}
</div>
```

---

## ⚡ نصائح الأداء

1. **استخدم `triggerOnce: true`** لتقليل حسابات الـ Intersection Observer
2. **حدّد `threshold` بعناية** - استخدم 0.15-0.25 للقيم الجيدة
3. **تجنب parallax على الهواتف** - استخدم `enableOnMobile: false`
4. **استخدم `will-change`** للعناصر المتحركة بكثافة
5. **راقب FPS** باستخدام Chrome DevTools Performance tab

---

## 🎯 أين تستخدم كل تأثير

| التأثير | الاستخدام | الأداء |
|--------|----------|-------|
| FallingSpheres | الخلفية (background) | ⭐⭐⭐⭐⭐ |
| Scroll Reveal | العناوين والنصوص | ⭐⭐⭐⭐⭐ |
| Staggered | Lists والـ grids | ⭐⭐⭐⭐⭐ |
| Marquee | Taglines والـ slogans | ⭐⭐⭐⭐⭐ |
| HoverCard | Cards والـ boxes | ⭐⭐⭐⭐☆ |
| Parallax | Backgrounds و Decorations | ⭐⭐⭐☆☆ |
| Interactive | Buttons والـ links | ⭐⭐⭐⭐⭐ |

---

## 🔍 استكشاف المشاكل

### المشكلة: التحريكات لا تعمل
**التحقق:**
1. تأكد من استيراد الـ hook: `import { useScrollAnimation } from "@/hooks/useScrollAnimation"`
2. تأكد من إضافة `ref` للعنصر: `<div ref={ref} className="scroll-reveal">`
3. تأكد من إضافة CSS class: `.scroll-reveal` موجود

### المشكلة: الأداء منخفضة
**الحل:**
1. استخدم `triggerOnce: true`
2. قلل عدد العناصر المتحركة
3. استخدم `transform` و `opacity` فقط
4. تجنب parallax على الهواتف

### المشكلة: الحركات متقطعة
**الحل:**
1. استخدم `requestAnimationFrame` (يتم تلقائياً)
2. تجنب `will-change` على كل عنصر
3. اختبر على أجهزة حقيقية

---

## 📖 ملف التوثيق الكامل

للمزيد من التفاصيل والأمثلة المتقدمة، انظر:
👉 `artifacts/cv-resume/EFFECTS_GUIDE.md`

---

**شكراً لاستخدام KitSys Effects! 🚀**

لأي استفسارات أو مشاكل، راجع دليل التوثيق الكامل.
