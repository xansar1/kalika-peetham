const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.primary-nav');

menuButton?.addEventListener('click', () => {
  const open = nav?.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(Boolean(open)));
});

document.querySelectorAll('.primary-nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const interestInputs = [...document.querySelectorAll('input[name="interest"]')];
const premiumNote = document.getElementById('premiumNote');
const premiumPlan = document.getElementById('premiumPlan');

function updateRegistrationMode(value) {
  if (premiumNote) premiumNote.hidden = value !== 'Premium Member';
}

interestInputs.forEach(input => {
  input.addEventListener('change', () => {
    if (input.checked) updateRegistrationMode(input.value);
  });
});

document.querySelectorAll('[data-interest]').forEach(link => {
  link.addEventListener('click', () => {
    const value = link.dataset.interest;
    const target = interestInputs.find(input => input.value === value);
    if (target) {
      target.checked = true;
      updateRegistrationMode(value);
      const requestedPlan = link.dataset.premiumPlan;
      if (requestedPlan && premiumPlan) premiumPlan.value = requestedPlan;
    }
  });
});

const checkedInterest = interestInputs.find(input => input.checked);
if (checkedInterest) updateRegistrationMode(checkedInterest.value);

const form = document.getElementById('joinForm');
const result = document.getElementById('formResult');
const joinSubmitButton = document.getElementById('joinSubmitButton');
const recurringConsent = document.getElementById('recurringConsent');

const PREMIUM_LABELS = {
  sadhu_seva: 'Sadhu Seva — ₹128/month',
  trustee: 'Bhaktamandali Trustee — ₹1,028/month'
};

function setFormResult(message, type = 'info') {
  if (!result) return;
  result.innerHTML = message;
  result.dataset.type = type;
  result.classList.add('show');
}

function setJoinLoading(loading) {
  if (!joinSubmitButton) return;
  joinSubmitButton.disabled = loading;
  joinSubmitButton.classList.toggle('is-loading', loading);
  joinSubmitButton.innerHTML = loading
    ? 'Opening secure payment…'
    : 'Continue <span>→</span>';
}

async function startPremiumSubscription(data) {
  const selectedPremiumPlan = String(data.get('premium_plan') || 'sadhu_seva');
  const name = String(data.get('name') || '').trim();
  const mobile = String(data.get('mobile') || '').trim();
  const email = String(data.get('email') || '').trim();
  const location = String(data.get('location') || '').trim();

  if (!recurringConsent?.checked) {
    setFormResult('<strong>Monthly authorisation required.</strong><br><span>Please tick the recurring contribution consent before continuing to Razorpay.</span>', 'error');
    return;
  }

  if (typeof window.Razorpay !== 'function') {
    setFormResult('<strong>Secure checkout could not load.</strong><br><span>Please check your internet connection and try again.</span>', 'error');
    return;
  }

  setJoinLoading(true);
  setFormResult('<strong>Preparing secure checkout…</strong><br><span>Please wait while we create your Razorpay subscription.</span>');

  try {
    const createResponse = await fetch('/api/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: selectedPremiumPlan,
        name,
        mobile,
        email,
        location
      })
    });

    const subscription = await createResponse.json();
    if (!createResponse.ok) {
      throw new Error(subscription.error || 'Unable to start the subscription.');
    }

    const checkout = new window.Razorpay({
      key: subscription.keyId,
      subscription_id: subscription.subscriptionId,
      name: 'Shri Kalika Peetham',
      description: PREMIUM_LABELS[selectedPremiumPlan] || subscription.planLabel,
      image: 'assets/kalika-peetham-logo.jpg',
      prefill: {
        name,
        contact: mobile,
        email
      },
      notes: {
        seva_pathway: subscription.planLabel,
        location: location || 'Not provided'
      },
      theme: {
        color: '#5b0c16'
      },
      modal: {
        ondismiss: () => {
          setJoinLoading(false);
          setFormResult('<strong>Payment window closed.</strong><br><span>No payment was completed. You can continue whenever you are ready.</span>');
        }
      },
      handler: async (razorpayResponse) => {
        try {
          const verifyResponse = await fetch('/api/verify-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(razorpayResponse)
          });
          const verification = await verifyResponse.json();

          if (!verifyResponse.ok || !verification.verified) {
            throw new Error(verification.error || 'Payment verification failed.');
          }

          setFormResult(
            '<strong>Payment verified successfully.</strong><br>' +
            '<span>Thank you for joining the seva pathway. Reference: ' +
            verification.subscriptionId +
            '</span>',
            'success'
          );
          form.reset();
          const regular = interestInputs.find(input => input.value === 'Regular Member');
          if (regular) regular.checked = true;
          updateRegistrationMode('Regular Member');
        } catch (error) {
          setFormResult(
            '<strong>Payment received, but verification needs attention.</strong><br>' +
            '<span>Please keep your Razorpay payment reference and contact Shri Kalika Peetham. ' +
            String(error.message || '') +
            '</span>',
            'error'
          );
        } finally {
          setJoinLoading(false);
        }
      }
    });

    checkout.on('payment.failed', (failure) => {
      const reason = failure?.error?.description || 'The payment was not completed.';
      setFormResult('<strong>Payment unsuccessful.</strong><br><span>' + reason + ' Please try again.</span>', 'error');
      setJoinLoading(false);
    });

    checkout.open();
  } catch (error) {
    setJoinLoading(false);
    setFormResult(
      '<strong>Could not start Razorpay.</strong><br><span>' +
      String(error.message || 'Please try again later.') +
      '</span>',
      'error'
    );
  }
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const mobile = String(data.get('mobile') || '').trim();
  const interest = String(data.get('interest') || 'Regular Member');

  if (!name || !mobile) {
    setFormResult('Please enter your full name and mobile number before continuing.', 'error');
    return;
  }

  if (interest === 'Premium Member') {
    await startPremiumSubscription(data);
    return;
  }

  setFormResult(
    '<strong>Registration details are ready.</strong><br>' +
    name + ' · ' + interest + ' · ' + mobile +
    '<br><span>Online storage for regular member and volunteer registrations will be connected in the next backend step.</span>'
  );
});

// V8 mobile navigation polish
if (menuButton && nav) {
  const syncMenuState = () => {
    const isOpen = nav.classList.contains('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  };

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      syncMenuState();
      menuButton.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('open')) return;
    if (nav.contains(event.target) || menuButton.contains(event.target)) return;
    nav.classList.remove('open');
    syncMenuState();
  });
}

// V9 — Seed Plant for Prosperity enquiry preview
const seedForm = document.getElementById('seed-interest-form');
const seedResult = document.getElementById('seedFormResult');
const seedInterestInputs = [...document.querySelectorAll('input[name="seed_interest"]')];

document.querySelectorAll('[data-seed-interest]').forEach(link => {
  link.addEventListener('click', () => {
    const wanted = link.dataset.seedInterest;
    const target = seedInterestInputs.find(input => input.value === wanted);
    if (target) target.checked = true;
  });
});

seedForm?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(seedForm);
  const name = String(data.get('seed_name') || '').trim();
  const mobile = String(data.get('seed_mobile') || '').trim();
  const interest = String(data.get('seed_interest') || 'Temple Registration');
  const org = String(data.get('seed_org') || '').trim();

  if (!name || !mobile) {
    if (seedResult) {
      seedResult.textContent = 'Please enter your full name and mobile number before reviewing the enquiry.';
      seedResult.classList.add('show');
    }
    return;
  }

  if (seedResult) {
    seedResult.innerHTML = `<strong>Enquiry preview ready.</strong><br>${name} · ${interest} · ${mobile}${org ? ` · ${org}` : ''}<br><span>This static preview has not sent the enquiry. Connect the form to WhatsApp, email or a backend before launch.</span>`;
    seedResult.classList.add('show');
  }
});

