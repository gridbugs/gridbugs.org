module Jekyll
    class FileDownload < Liquid::Tag
        def initialize(tag_name, arg, tokens)
            super
            parts = arg.split('|')
            @filename = parts[0].strip
            @text = parts[1].strip
        end

        def render(context)
            site_url = context.registers[:site].config['url']
            base_url = context.registers[:site].baseurl
            dest_url = "#{site_url}#{base_url}/files/#{@filename}"
            "<a href=\"#{dest_url}\">#{@text}</a>"
        end
    end
end

Liquid::Template::register_tag('file', Jekyll::FileDownload)
