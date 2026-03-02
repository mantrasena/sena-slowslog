import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const categories = {
  Happy: ["(｡◕‿◕｡)", "(◕‿◕)", "(ﾉ◕ヮ◕)ﾉ*:・ﾟ✧", "(*´▽`*)", "(◠‿◠)", "(✿◠‿◠)", "(*≧ω≦)", "✧◝(⁰▿⁰)◜✧"],
  Calm: ["(‾◡◝)", "(ᵕ—ᴗ—)", "( ˘ᴗ˘ )", "(◡‿◡)", "(ᴗ_ ᴗ。)", "( ◜‿◝ )"],
  Sad: ["(╥﹏╥)", "(っ˘̩╭╮˘̩)っ", "(;﹏;)", "(T_T)", "(ᗒᗣᗕ)"],
  Love: ["(｡♥‿♥｡)", "(♡μ_μ)", "(◕‿◕)♡", "( ´ ▽ ` ).｡ﾟ♡", "(灬♥ω♥灬)"],
  Play: ["(づ￣ ³￣)づ", "ヽ(>∀<☆)ノ", "( ˘ ³˘)♥", "(ﾉ´ з `)ノ"],
  Think: ["(⊙_⊙)", "(¬‿¬)", "(눈_눈)", "( •̀ᴗ•́ )", "(⌐■_■)"],
  Write: ["✍(◔◡◔)", "φ(゜▽゜*)", "φ(..)", "✎(ノ_<。)"],
} as const;

type Category = keyof typeof categories;

interface KaomojiPickerProps {
  onSelect: (kaomoji: string) => void;
  children: React.ReactNode;
}

const KaomojiPicker = ({ onSelect, children }: KaomojiPickerProps) => {
  const [active, setActive] = useState<Category>("Happy");

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="mb-3 flex flex-wrap gap-1">
          {(Object.keys(categories) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                active === cat
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {categories[active].map((k) => (
            <button
              key={k}
              onClick={() => onSelect(k)}
              className="rounded-lg p-2 text-xs transition-colors hover:bg-muted text-center"
            >
              {k}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default KaomojiPicker;
