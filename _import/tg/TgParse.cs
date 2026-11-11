using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;

public class Msg {
    public int id; public string dt = ""; public string name = ""; public bool joined; public int reply;
    public string text = ""; public List<string> links = new List<string>();
    public string media = ""; public string mtitle = ""; public bool fwd; public string fwdFrom = "";
    public int nrep; public bool bot; public int file;
}

public static class TgParse {
    static Regex rxId = new Regex("^(default|service)([^\"]*)\" id=\"message(-?\\d+)\"", RegexOptions.Compiled);
    static Regex rxDate = new Regex("class=\"pull_right date details\" title=\"([^\"]+)\"", RegexOptions.Compiled);
    static Regex rxFrom = new Regex("<div class=\"from_name\">\\s*(.*?)\\s*</div>", RegexOptions.Compiled | RegexOptions.Singleline);
    static Regex rxReply = new Regex("class=\"reply_to details\">.*?go_to_message(\\d+)", RegexOptions.Compiled | RegexOptions.Singleline);
    static Regex rxText = new Regex("<div class=\"text\">\\s*(.*?)\\s*</div>", RegexOptions.Compiled | RegexOptions.Singleline);
    static Regex rxMedia = new Regex("class=\"media clearfix pull_left (?:block_link )?media_(\\w+)\"", RegexOptions.Compiled);
    static Regex rxTitle = new Regex("<div class=\"title bold\">\\s*(.*?)\\s*</div>", RegexOptions.Compiled | RegexOptions.Singleline);
    static Regex rxHref = new Regex("<a [^>]*href=\"([^\"]+)\"", RegexOptions.Compiled);
    static Regex rxTag = new Regex("<[^>]+>", RegexOptions.Compiled);
    static Regex rxBr = new Regex("<br\\s*/?>", RegexOptions.Compiled);
    static Regex rxSpan = new Regex("<span class=\"date details\"[^>]*>.*?</span>", RegexOptions.Compiled | RegexOptions.Singleline);

    public static List<Msg> All = new List<Msg>();
    public static Dictionary<int, Msg> ById = new Dictionary<int, Msg>();

    static string Plain(string h) {
        h = h.Replace("\r", "").Replace("\n", "");
        h = rxBr.Replace(h, "\n");
        h = rxTag.Replace(h, "");
        return WebUtility.HtmlDecode(h).Trim();
    }

    public static int Parse(string dir) {
        var files = Directory.GetFiles(dir, "messages*.html")
            .OrderBy(f => { var n = Path.GetFileNameWithoutExtension(f).Substring(8); return n == "" ? 1 : int.Parse(n); }).ToList();
        string last = "";
        int fi = 0;
        foreach (var f in files) {
            fi++;
            var t = File.ReadAllText(f, Encoding.UTF8);
            var parts = t.Split(new string[] { "<div class=\"message " }, StringSplitOptions.None);
            for (int i = 1; i < parts.Length; i++) {
                var p = parts[i];
                var m = rxId.Match(p);
                if (!m.Success || m.Groups[1].Value == "service") continue;
                var x = new Msg();
                x.id = int.Parse(m.Groups[3].Value);
                x.file = fi;
                x.joined = m.Groups[2].Value.Contains("joined");
                var d = rxDate.Match(p); if (d.Success) x.dt = d.Groups[1].Value;
                string body = p; string fw = "";
                int fx = p.IndexOf("<div class=\"forwarded body\">");
                if (fx >= 0) { x.fwd = true; body = p.Substring(0, fx); fw = p.Substring(fx); }
                var fr = rxFrom.Match(body);
                if (fr.Success) { x.name = Plain(fr.Groups[1].Value); last = x.name; } else x.name = last;
                if (x.fwd) { var ff = rxFrom.Match(fw); if (ff.Success) x.fwdFrom = Plain(rxSpan.Replace(ff.Groups[1].Value, "")); }
                var r = rxReply.Match(body); if (r.Success) x.reply = int.Parse(r.Groups[1].Value);
                var tx = rxText.Match(p);
                if (tx.Success) {
                    x.text = Plain(tx.Groups[1].Value);
                    foreach (Match h in rxHref.Matches(tx.Groups[1].Value)) x.links.Add(WebUtility.HtmlDecode(h.Groups[1].Value));
                }
                var md = rxMedia.Match(p);
                if (md.Success) { x.media = md.Groups[1].Value; var ti = rxTitle.Match(p); if (ti.Success) x.mtitle = Plain(ti.Groups[1].Value); }
                else if (p.Contains("photo_wrap")) x.media = "photo";
                else if (p.Contains("video_file_wrap")) x.media = "video";
                else if (p.Contains("sticker")) x.media = "sticker";
                All.Add(x); ById[x.id] = x;
            }
        }
        return All.Count;
    }

    public static string J(string s) {
        var sb = new StringBuilder("\"");
        foreach (char c in s) {
            if (c == '"') sb.Append("\\\""); else if (c == '\\') sb.Append("\\\\");
            else if (c == '\n') sb.Append("\\n"); else if (c == '\t') sb.Append("\\t");
            else if (c < 32) sb.Append(' '); else sb.Append(c);
        }
        return sb.Append('"').ToString();
    }

    public static string ToJson(Msg x) {
        return "{\"id\":" + x.id + ",\"dt\":" + J(x.dt) + ",\"name\":" + J(x.name) + ",\"reply\":" + x.reply +
            ",\"nrep\":" + x.nrep + ",\"media\":" + J(x.media) + ",\"mtitle\":" + J(x.mtitle) +
            ",\"fwd\":" + J(x.fwd ? (x.fwdFrom == "" ? "?" : x.fwdFrom) : "") +
            ",\"links\":[" + string.Join(",", x.links.Select(J)) + "],\"text\":" + J(x.text) + "}";
    }

    public static void Dump(string path, IEnumerable<Msg> ms) {
        using (var w = new StreamWriter(path, false, new UTF8Encoding(false)))
            foreach (var x in ms) w.WriteLine(ToJson(x));
    }
}
