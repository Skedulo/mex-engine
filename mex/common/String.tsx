export class String {
    public static Empty: string = "";

    public static format(value:string, ...args:any): string {
        try {
            return value.replace(/{(\d+(:.*)?)}/g, function (match, i) {
                var s = match.split(':');
                if (s.length > 1) {
                    i = i[0];
                    match = s[1].replace('}', '');
                }

                var arg = String.formatPattern(match, args[i]);
                return typeof arg != 'undefined' && arg != null ? arg : String.Empty;
            });
        }
        catch (e) {
            return String.Empty;
        }
    }

    private static formatPattern(match:string, arg:string): string {
        switch (match) {
            case 'L':
                arg = arg.toLowerCase();
                break;
            case 'U':
                arg = arg.toUpperCase();
                break;
            default:
                break;
        }

        return arg;
    }
}
