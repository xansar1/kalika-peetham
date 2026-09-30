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

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const mobile = String(data.get('mobile') || '').trim();
  const interest = String(data.get('interest') || 'Regular Member');
  const selectedPremiumPlan = String(data.get('premium_plan') || 'Sadhu Seva — minimum ₹128/month');

  if (!name || !mobile) {
    if (result) {
      result.textContent = 'Please enter your full name and mobile number before reviewing the registration.';
      result.classList.add('show');
    }
    return;
  }

  if (result) {
    const premiumText = interest === 'Premium Member'
      ? `<br><span>Selected premium pathway: ${selectedPremiumPlan}. This static preview does not process payments yet.</span>`
      : '<br><span>This static website preview does not send the form yet. It can be connected to WhatsApp, email, Google Sheets or a backend.</span>';

    result.innerHTML = `<strong>Registration preview ready.</strong><br>${name} · ${interest} · ${mobile}${premiumText}`;
    result.classList.add('show');
  }
});
