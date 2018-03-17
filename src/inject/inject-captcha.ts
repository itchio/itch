interface IExtWindow {
  onCaptcha: (response: string) => void;
  captchaResponse: string;
}
const extWindow: IExtWindow = window as any;

extWindow.onCaptcha = function(response: string) {
  extWindow.captchaResponse = response;
};
