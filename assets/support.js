// Customer support form. Posts to Web3Forms, which emails the message to the
// address the access key was created with; Reply-To is the customer's address.
// Without JavaScript the form still works as a plain POST.
(function () {
  var form = document.getElementById('supportForm');
  if (!form) return;
  var status = document.getElementById('formStatus');
  var button = form.querySelector('button[type="submit"]');
  var sent = document.getElementById('sentPanel');

  // Preselect the product from links like customer-support/?product=ndvdb
  var wanted = (new URLSearchParams(location.search).get('product') || '').toLowerCase();
  Array.prototype.forEach.call(form.elements.Product.options, function (o) {
    if (o.value.toLowerCase() === wanted) o.selected = true;
  });

  if (form.elements.access_key.value.indexOf('YOUR_') === 0) {
    document.getElementById('formNotice').hidden = false;
    button.disabled = true;
    return;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var data = Object.fromEntries(new FormData(form));
    Object.keys(data).forEach(function (k) { if (data[k] === '') delete data[k]; }); // skip empty optional fields
    data.subject = '[' + data.Product + '] ' + data.Topic + ' from ' + data.name;
    data.replyto = data.email;

    setStatus('Sending…');
    button.disabled = true;
    try {
      var res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      var body = await res.json().catch(function () { return {}; });
      if (!res.ok || !body.success) throw new Error(body.message || 'HTTP ' + res.status);
      form.hidden = true;
      sent.hidden = false;
      sent.focus();
      setStatus('');
    } catch (err) {
      setStatus('Sorry, your message could not be sent (' + err.message + '). Please try again in a few minutes.', true);
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById('sendAnother').addEventListener('click', function () {
    form.reset();
    form.hidden = false;
    sent.hidden = true;
    form.elements.name.focus();
  });

  function setStatus(text, bad) {
    status.textContent = text;
    status.classList.toggle('bad', !!bad);
  }
})();
