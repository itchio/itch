interface ExtWindow {
  onCaptcha: (response: string) => void;
  captchaResponse: string;
}
const extWindow: ExtWindow = window as any;

extWindow.onCaptcha = function (response: string) {
  extWindow.captchaResponse = response;
};
