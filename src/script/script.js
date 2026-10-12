    // ============================================================
    // ✅ CONFIGURATION — replace all placeholder values below
    // ============================================================

    // EmailJS — https://www.emailjs.com
    const EMAILJS_PUBLIC_KEY          = 'OKQo-SaPc7w0hM1rT';
    const EMAILJS_SERVICE_ID          = 'service_2uztpjl';
    const EMAILJS_SERVICE_TEMPLATE_ID = 'template_negjc3h'; // for service request form
    const EMAILJS_CONTACT_TEMPLATE_ID = 'template_qrp8ggj'; // for contact form

    // Google reCAPTCHA v2 — https://www.google.com/recaptcha/admin
    // Register site → "reCAPTCHA v2 - I'm not a robot" → copy Site Key here:
    const RECAPTCHA_SITE_KEY = '6LdSb4ssAAAAAFKkGlkIZA_TmVTMzwSnQOAj2eMp';

    // Initialise EmailJS
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

    // ============================================================
    // ✅ reCAPTCHA — explicit render so we control each widget
    // The reCAPTCHA script calls onRecaptchaLoad() once it is ready
    // ============================================================
    let srCaptchaId = null;
    let ctCaptchaId = null;

    function onRecaptchaLoad() {
        srCaptchaId = grecaptcha.render('sr-recaptcha', { sitekey: RECAPTCHA_SITE_KEY });
        ctCaptchaId = grecaptcha.render('ct-recaptcha', { sitekey: RECAPTCHA_SITE_KEY });
    }

    // ============================================================
    // HELPER: show/hide modal
    // ============================================================
    function showModal(type, title, message) {
        if (type === 'success') {
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalMessage').textContent = message;
            document.getElementById('successModal').classList.remove('hidden');
        } else {
            document.getElementById('errorModal').classList.remove('hidden');
        }
    }

    document.getElementById('modalCloseButton').addEventListener('click', () => {
        document.getElementById('successModal').classList.add('hidden');
    });
    document.getElementById('errorModalCloseButton').addEventListener('click', () => {
        document.getElementById('errorModal').classList.add('hidden');
    });
    document.getElementById('successModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('successModal'))
            document.getElementById('successModal').classList.add('hidden');
    });
    document.getElementById('errorModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('errorModal'))
            document.getElementById('errorModal').classList.add('hidden');
    });

    // ============================================================
    // HELPER: field validation UI
    // ============================================================
    function setError(inputId, errId, show) {
        const input = document.getElementById(inputId);
        const err   = document.getElementById(errId);
        if (show) {
            input.classList.add('input-error');
            err.classList.add('show');
        } else {
            input.classList.remove('input-error');
            err.classList.remove('show');
        }
    }

    // ============================================================
    // HELPER: toggle button loading state
    // ============================================================
    function setLoading(btnId, textId, spinnerId, loading) {
        const btn     = document.getElementById(btnId);
        const text    = document.getElementById(textId);
        const spinner = document.getElementById(spinnerId);
        // On first call save the original label so we can always restore it
        if (!text.dataset.original) text.dataset.original = text.textContent;
        btn.disabled     = loading;
        text.textContent = loading ? 'Sending...' : text.dataset.original;
        spinner.classList.toggle('hidden', !loading);
    }

    // ============================================================
    // ✅ SERVICE REQUEST FORM
    // ============================================================
    document.getElementById('serviceRequestForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const name    = document.getElementById('sr-name').value.trim();
        const phone   = document.getElementById('sr-phone').value.trim();
        const service = document.getElementById('sr-service').value;
        const message = document.getElementById('sr-message').value.trim();

        // Validate
        let valid = true;
        setError('sr-name',    'sr-name-err',    !name);                           if (!name)    valid = false;
        setError('sr-phone',   'sr-phone-err',   !/^\d{10}$/.test(phone));         if (!/^\d{10}$/.test(phone)) valid = false;
        setError('sr-service', 'sr-service-err', !service);                        if (!service) valid = false;

        // reCAPTCHA check
        const srCaptcha = grecaptcha.getResponse(srCaptchaId);
        setError('sr-recaptcha', 'sr-recaptcha-err', !srCaptcha);
        if (!srCaptcha) valid = false;

        if (!valid) return;

        setLoading('sr-submit-btn', 'sr-btn-text', 'sr-btn-spinner', true);

        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_SERVICE_TEMPLATE_ID, {
                from_name:    name,
                from_phone:   phone,
                service_type: service,
                message:      message || 'No additional details provided.',
            });

            document.getElementById('serviceRequestForm').reset();
            grecaptcha.reset(srCaptchaId);
            showModal('success',
                'Service Request Sent! 🎉',
                `Thank you ${name}! We've received your request for "${service}" and will call you on ${phone} within 30 minutes.`
            );
        } catch (error) {
            console.error('EmailJS error:', error);
            grecaptcha.reset(srCaptchaId);
            showModal('error');
        } finally {
            setLoading('sr-submit-btn', 'sr-btn-text', 'sr-btn-spinner', false);
        }
    });

    // ============================================================
    // ✅ CONTACT FORM
    // ============================================================
    document.getElementById('contactForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const name    = document.getElementById('ct-name').value.trim();
        const email   = document.getElementById('ct-email').value.trim();
        const subject = document.getElementById('ct-subject').value.trim();
        const message = document.getElementById('ct-message').value.trim();
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validate
        let valid = true;
        setError('ct-name',    'ct-name-err',    !name);                      if (!name)              valid = false;
        setError('ct-email',   'ct-email-err',   !emailRe.test(email));       if (!emailRe.test(email)) valid = false;
        setError('ct-subject', 'ct-subject-err', !subject);                   if (!subject)           valid = false;
        setError('ct-message', 'ct-message-err', !message);                   if (!message)           valid = false;

        // reCAPTCHA check
        const ctCaptcha = grecaptcha.getResponse(ctCaptchaId);
        setError('ct-recaptcha', 'ct-recaptcha-err', !ctCaptcha);
        if (!ctCaptcha) valid = false;

        if (!valid) return;

        setLoading('ct-submit-btn', 'ct-btn-text', 'ct-btn-spinner', true);

        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CONTACT_TEMPLATE_ID, {
                from_name:  name,
                from_email: email,
                subject:    subject,
                message:    message,
            });

            document.getElementById('contactForm').reset();
            grecaptcha.reset(ctCaptchaId);
            showModal('success',
                'Message Sent! ✅',
                `Thanks ${name}! We've received your message and will reply to ${email} as soon as possible.`
            );
        } catch (error) {
            console.error('EmailJS error:', error);
            grecaptcha.reset(ctCaptchaId);
            showModal('error');
        } finally {
            setLoading('ct-submit-btn', 'ct-btn-text', 'ct-btn-spinner', false);
        }
    });

    // ============================================================
    // ✅ NEWSLETTER FORM (EmailJS)
    // ============================================================
    document.getElementById('newsletterForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email   = document.getElementById('nl-email').value.trim();
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const feedback = document.getElementById('nl-feedback');

        if (!emailRe.test(email)) {
            feedback.textContent = '⚠️ Please enter a valid email address.';
            feedback.className = 'mt-4 text-sm font-medium text-yellow-200';
            feedback.classList.remove('hidden');
            return;
        }

        setLoading('nl-submit-btn', 'nl-btn-text', 'nl-btn-spinner', true);
        feedback.classList.add('hidden');

        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CONTACT_TEMPLATE_ID, {
                from_name:  'Newsletter Subscriber',
                from_email: email,
                subject:    'New Newsletter Subscription',
                message:    `${email} has subscribed to the ElectrooBuddy newsletter.`,
            });

            this.reset();
            feedback.textContent = '🎉 Subscribed! You\'ll hear from us soon.';
            feedback.className = 'mt-4 text-sm font-medium text-green-200 transition-opacity duration-700';
            feedback.classList.remove('hidden');
            // Auto-hide after 4 seconds with a fade-out
            setTimeout(() => {
                feedback.style.opacity = '0';
                setTimeout(() => {
                    feedback.classList.add('hidden');
                    feedback.style.opacity = '';
                }, 700); // matches the CSS transition duration
            }, 4000);
        } catch (error) {
            feedback.textContent = '❌ Subscription failed. Please try again.';
            feedback.className = 'mt-4 text-sm font-medium text-red-200';
            feedback.classList.remove('hidden');
        } finally {
            setLoading('nl-submit-btn', 'nl-btn-text', 'nl-btn-spinner', false);
        }
    });

    // ============================================================
    // DARK MODE
    // ============================================================
    const toggle = document.getElementById('toggle');
    const mobileToggle = document.getElementById('mobile-toggle');
    const html = document.documentElement;

    if (localStorage.getItem('darkMode') === 'true' ||
        (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
        toggle.checked = true;
        mobileToggle.checked = true;
    }

    function toggleDarkMode() {
        html.classList.toggle('dark');
        localStorage.setItem('darkMode', html.classList.contains('dark'));
        // Sync both toggles
        toggle.checked = html.classList.contains('dark');
        mobileToggle.checked = html.classList.contains('dark');
    }
    toggle.addEventListener('change', toggleDarkMode);
    mobileToggle.addEventListener('change', toggleDarkMode);

    // ============================================================
    // MOBILE MENU
    // ============================================================
    document.getElementById('mobile-menu-button').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });
    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', () => document.getElementById('mobile-menu').classList.add('hidden'));
    });

    // ============================================================
    // ACTIVE NAV HIGHLIGHTING
    // Watches each section — highlights the matching nav link
    // as you scroll through the page
    // ============================================================
    (function() {
        const sections   = document.querySelectorAll('section[id]');
        const navLinks   = document.querySelectorAll('nav a[href^="#"]');

        function setActive(id) {
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === '#request-service') return; // never highlight the CTA button
                if (href === '#' + id) {
                    link.classList.add('nav-link-active');
                } else {
                    link.classList.remove('nav-link-active');
                }
            });
        }

        // Use IntersectionObserver — fires when a section is ≥20% visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActive(entry.target.id);
                }
            });
        }, { threshold: 0.2, rootMargin: '-60px 0px -40% 0px' });

        sections.forEach(section => observer.observe(section));
    })();

    // ============================================================
    // SMOOTH COUNTER ANIMATION
    // ============================================================
    (function() {
        const counters  = document.querySelectorAll('.counter-value');
        let animated    = false;

        counters.forEach(c => { c.innerText = '0'; });

        function startAnimation() {
            if (animated) return;
            animated = true;
            const start    = performance.now();
            const duration = 2000;

            function tick(now) {
                const progress = Math.min((now - start) / duration, 1);
                const ease = progress < 0.5
                    ? 4 * progress ** 3
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                counters.forEach(c => {
                    const target  = parseInt(c.dataset.target);
                    const current = Math.floor(target * ease);
                    c.innerText   = current.toLocaleString() + (c.closest('#counter3') ? '+' : '');
                });

                if (progress < 1) requestAnimationFrame(tick);
                else counters.forEach(c => {
                    const t = parseInt(c.dataset.target);
                    c.innerText = t.toLocaleString() + (c.closest('#counter3') ? '+' : '');
                });
            }
            requestAnimationFrame(tick);
        }

        const obs = new IntersectionObserver(entries => {
            if (entries.some(e => e.isIntersecting)) startAnimation();
        });
        document.querySelectorAll('.stats-counter').forEach(el => obs.observe(el));
    })();

    // ============================================================
    // TESTIMONIAL CAROUSEL
    // ============================================================
    const carousel = document.getElementById('testimonialCarousel');
    document.getElementById('prevTestimonial').addEventListener('click', () => carousel.scrollBy({ left: -340, behavior: 'smooth' }));
    document.getElementById('nextTestimonial').addEventListener('click', () => carousel.scrollBy({ left: 340, behavior: 'smooth' }));

    // ============================================================
    // FAQ ACCORDION
    // ============================================================
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            q.nextElementSibling.classList.toggle('hidden');
            q.querySelector('i').classList.toggle('rotate-180');
        });
    });

    // ============================================================
    // BACK TO TOP
    // ============================================================
    const backToTopBtn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.remove('opacity-0', 'invisible');
            backToTopBtn.classList.add('opacity-100', 'visible');
        } else {
            backToTopBtn.classList.add('opacity-0', 'invisible');
            backToTopBtn.classList.remove('opacity-100', 'visible');
        }
    });
    backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // ============================================================
    // SCROLL ANIMATIONS
    // ============================================================
    document.querySelectorAll('.slide-up').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    document.querySelectorAll('.fade-in').forEach(el => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.6s ease';
    });

    function animateOnScroll() {
        document.querySelectorAll('.slide-up, .fade-in').forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight / 1.2) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    }
    window.addEventListener('scroll', animateOnScroll);
    window.addEventListener('load', animateOnScroll);
    animateOnScroll();