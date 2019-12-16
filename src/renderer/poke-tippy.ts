type TippifiedHTMLElement = HTMLElement & {
  _tippy?: {
    popperInstance: {
      update(): void;
    };
  };
};

export function pokeTippy(ref: React.RefObject<HTMLElement>) {
  if (!ref.current) {
    return;
  }

  let el: TippifiedHTMLElement | null = ref.current as TippifiedHTMLElement;
  while (el) {
    if (el._tippy) {
      try {
        el._tippy.popperInstance.update();
      } catch (e) {
        console.warn(e);
      } finally {
        return;
      }
    }
    el = el.parentElement as TippifiedHTMLElement | null;
  }
}
