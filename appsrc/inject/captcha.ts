
(window as any).onCaptcha = function (response: string) {
  console.log("recaptcha response: ", response);
  (window as any).captchaResponse = response;
}
