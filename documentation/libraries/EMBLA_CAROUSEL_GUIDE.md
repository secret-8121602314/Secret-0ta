# Embla Carousel Complete Implementation Guide

Comprehensive guide to Embla Carousel—a lightweight, fluid carousel library for building responsive, accessible image galleries and content carousels with React integration.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Basic Implementation](#basic-implementation)
3. [React Hook Integration](#react-hook-integration)
4. [Navigation Controls](#navigation-controls)
5. [Event Handling](#event-handling)
6. [Plugins](#plugins)
7. [Responsive Design](#responsive-design)
8. [Advanced Features](#advanced-features)
9. [Best Practices](#best-practices)

## Installation & Setup

### Install Packages

```bash
npm install embla-carousel embla-carousel-react
```

### Optional Plugins

```bash
npm install embla-carousel-autoplay embla-carousel-class-names embla-carousel-fade
```

## Basic Implementation

### Simple Carousel

```tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import EmblaCarousel from 'embla-carousel';

function BasicCarousel() {
  const [emblaApi, setEmblaApi] = useState(null);
  const emblaRef = useRef(null);

  useEffect(() => {
    if (!emblaRef.current) return;

    const embla = EmblaCarousel(emblaRef.current, {
      loop: true,
      align: 'start'
    });

    setEmblaApi(embla);

    return () => embla.destroy();
  }, []);

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        <div className="embla__slide">Slide 1</div>
        <div className="embla__slide">Slide 2</div>
        <div className="embla__slide">Slide 3</div>
      </div>
    </div>
  );
}
```

### CSS Styling

```css
.embla {
  max-width: 100%;
  overflow: hidden;
}

.embla__container {
  display: flex;
  touch-action: pan-y;
  margin-left: calc(var(--slide-spacing, 1rem) * -1);
}

.embla__slide {
  flex: 0 0 100%;
  min-width: 0;
  padding-left: var(--slide-spacing, 1rem);
  gap: var(--slide-spacing, 1rem);
}

@media (min-width: 768px) {
  .embla__slide {
    flex: 0 0 50%;
  }
}

@media (min-width: 1024px) {
  .embla__slide {
    flex: 0 0 33.333%;
  }
}
```

## React Hook Integration

### useEmblaCarousel Hook

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';

function CarouselWithHook() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false 
  });

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {[1, 2, 3, 4, 5].map(num => (
          <div key={num} className="embla__slide">
            <img src={`slide-${num}.jpg`} alt={`Slide ${num}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Extract Hook Data

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';

function CarouselWithData() {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedIndex());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);

    return () => emblaApi.off('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {[1, 2, 3].map(num => (
            <div key={num} className="embla__slide">
              Slide {num}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === selectedIndex ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>

      <p>Current slide: {selectedIndex + 1}</p>
    </div>
  );
}
```

## Navigation Controls

### Previous/Next Buttons

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';

function CarouselWithButtons() {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {[1, 2, 3, 4, 5].map(num => (
            <div key={num} className="embla__slide">
              Slide {num}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canScrollPrev}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        
        <button
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canScrollNext}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Keyboard Navigation

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';
import { useEffect } from 'react';

function CarouselWithKeyboard() {
  const [emblaRef, emblaApi] = useEmblaCarousel();

  useEffect(() => {
    if (!emblaApi) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        emblaApi.scrollPrev();
      } else if (e.key === 'ArrowRight') {
        emblaApi.scrollNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [emblaApi]);

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {/* slides */}
      </div>
    </div>
  );
}
```

## Event Handling

### Listen to Events

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';
import { useEffect, useCallback } from 'react';

function CarouselWithEvents() {
  const [emblaRef, emblaApi] = useEmblaCarousel();

  useEffect(() => {
    if (!emblaApi) return;

    // Called when carousel is initialized
    emblaApi.on('init', (api) => {
      console.log('Carousel initialized');
    });

    // Called when scrolling starts
    emblaApi.on('pointerDown', () => {
      console.log('User started scrolling');
    });

    // Called when selected slide changes
    emblaApi.on('select', () => {
      console.log('Selected slide:', emblaApi.selectedIndex());
    });

    // Called when scroll animation settles
    emblaApi.on('settle', () => {
      console.log('Scroll settled');
    });

    // Called when carousel is destroyed
    emblaApi.on('destroy', () => {
      console.log('Carousel destroyed');
    });

    return () => emblaApi.destroy();
  }, [emblaApi]);

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {[1, 2, 3].map(num => (
          <div key={num} className="embla__slide">Slide {num}</div>
        ))}
      </div>
    </div>
  );
}
```

## Plugins

### Autoplay Plugin

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

function AutoplayCarousel() {
  const [emblaRef] = useEmblaCarousel(
    { loop: true },
    [
      Autoplay({
        delay: 4000,
        stopOnInteraction: true,
        stopOnMouseEnter: true
      })
    ]
  );

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {[1, 2, 3].map(num => (
          <div key={num} className="embla__slide">
            <img src={`slide-${num}.jpg`} alt={`Slide ${num}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### ClassNames Plugin

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';
import ClassNames from 'embla-carousel-class-names';

function ClassNamesCarousel() {
  const [emblaRef] = useEmblaCarousel(
    {},
    [
      ClassNames({
        inView: 'is-in-view',
        notInView: 'is-not-in-view'
      })
    ]
  );

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {[1, 2, 3].map(num => (
          <div key={num} className="embla__slide">
            Slide {num}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Fade Plugin

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';
import Fade from 'embla-carousel-fade';

function FadeCarousel() {
  const [emblaRef] = useEmblaCarousel(
    { loop: true },
    [Fade()]
  );

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {[1, 2, 3].map(num => (
          <div key={num} className="embla__slide">
            <img src={`slide-${num}.jpg`} alt={`Slide ${num}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Auto Height Plugin

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';
import AutoHeight from 'embla-carousel-auto-height';

function AutoHeightCarousel() {
  const [emblaRef] = useEmblaCarousel({}, [AutoHeight()]);

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        <div className="embla__slide">
          <p>Short content</p>
        </div>
        <div className="embla__slide">
          <p>Much longer content here that spans multiple lines and requires more vertical space to display properly</p>
        </div>
        <div className="embla__slide">
          <p>Medium content</p>
        </div>
      </div>
    </div>
  );
}
```

## Responsive Design

### Breakpoint-based Configuration

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';
import { useEffect, useState } from 'react';

function ResponsiveCarousel() {
  const [windowSize, setWindowSize] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getOptions = () => {
    if (windowSize === null) return { slidesToScroll: 1 };
    if (windowSize < 640) return { slidesToScroll: 1 };
    if (windowSize < 1024) return { slidesToScroll: 2 };
    return { slidesToScroll: 3 };
  };

  const [emblaRef] = useEmblaCarousel(getOptions());

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {[1, 2, 3, 4, 5, 6].map(num => (
          <div key={num} className="embla__slide">
            Slide {num}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Media Query Breakpoints

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';

function MediaQueryCarousel() {
  const [emblaRef] = useEmblaCarousel({
    breakpoints: {
      '(max-width: 640px)': { slidesToScroll: 1 },
      '(min-width: 641px) and (max-width: 1023px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 }
    }
  });

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {[1, 2, 3, 4, 5, 6].map(num => (
          <div key={num} className="embla__slide">
            Slide {num}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Advanced Features

### Slide Tracking (In-View Detection)

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';
import { useEffect, useState, useCallback } from 'react';

function CarouselWithTracking() {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [slidesInView, setSlidesInView] = useState([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSlidesInView(emblaApi.slidesInView());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {[1, 2, 3, 4, 5].map(num => (
            <div
              key={num}
              className={`embla__slide ${
                slidesInView.includes(num - 1) ? 'in-view' : ''
              }`}
            >
              Slide {num}
            </div>
          ))}
        </div>
      </div>

      <p>Slides in view: {slidesInView.map(i => i + 1).join(', ')}</p>
    </div>
  );
}
```

### Progress Indicator

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';
import { useEffect, useState, useCallback } from 'react';

function CarouselWithProgress() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [progress, setProgress] = useState(0);

  const handleSelect = useCallback(() => {
    if (!emblaApi) return;
    
    const current = emblaApi.selectedIndex();
    const total = emblaApi.scrollSnapList().length;
    
    setProgress((current + 1) / total * 100);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    handleSelect();
    emblaApi.on('select', handleSelect);

    return () => emblaApi.off('select', handleSelect);
  }, [emblaApi, handleSelect]);

  return (
    <div>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {[1, 2, 3, 4, 5].map(num => (
            <div key={num} className="embla__slide">
              Slide {num}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-gray-200 h-1 mt-4">
        <div
          className="bg-blue-600 h-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
```

### RTL (Right-to-Left) Support

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';

function RTLCarousel() {
  const [emblaRef] = useEmblaCarousel({
    direction: 'rtl'
  });

  return (
    <div className="embla" dir="rtl" ref={emblaRef}>
      <div className="embla__container">
        {[1, 2, 3].map(num => (
          <div key={num} className="embla__slide">
            Slide {num}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Accessibility

```tsx
function AccessibleCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel();

  return (
    <div
      className="embla"
      ref={emblaRef}
      role="region"
      aria-label="Image carousel"
      aria-roledescription="carousel"
    >
      <div className="embla__container" role="group">
        {slides.map((slide, index) => (
          <div
            key={index}
            className="embla__slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${slides.length}`}
          >
            <img src={slide} alt={`Carousel slide ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Performance Optimization

```tsx
import { useEmblaCarousel } from 'embla-carousel-react';
import { memo, useCallback, useEffect, useState } from 'react';

const CarouselSlide = memo(({ src, index, isInView }) => (
  <div className="embla__slide">
    {isInView && <img src={src} alt={`Slide ${index}`} loading="lazy" />}
  </div>
));

function OptimizedCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [slidesInView, setSlidesInView] = useState([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSlidesInView(emblaApi.slidesInView());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    onSelect();
    emblaApi.on('select', onSelect);

    return () => emblaApi.off('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {slides.map((slide, index) => (
          <CarouselSlide
            key={index}
            src={slide}
            index={index}
            isInView={slidesInView.includes(index)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 3. Error Handling

```tsx
function SafeCarousel() {
  const [emblaRef, emblaApi] = useEmblaApi(emblaRef, options, plugins);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!emblaApi) return;

    try {
      emblaApi.on('select', () => {
        // Handle selection
      });
    } catch (err) {
      setError(err.message);
    }

    return () => {
      try {
        emblaApi.destroy();
      } catch (err) {
        console.error('Error destroying carousel:', err);
      }
    };
  }, [emblaApi]);

  if (error) return <div>Carousel error: {error}</div>;

  return <div className="embla" ref={emblaRef} />;
}
```

## Conclusion

Embla Carousel provides a lightweight, highly customizable carousel solution with React integration. Its plugin architecture, responsive capabilities, and event system make it suitable for building complex image galleries and content carousels while maintaining excellent performance and accessibility.
