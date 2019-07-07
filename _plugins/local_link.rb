module Jekyll
    class LocalLink < Liquid::Tag
        def initialize(tag_name, arg, tokens)
            super
            parts = arg.split('|')
            @local_url = parts[0].strip
            @text = parts[1].strip
        end

        def render(context)
            site_url = context.registers[:site].config['url']
            base_url = context.registers[:site].baseurl
            dest_url = "#{site_url}#{base_url}/#{@local_url}"
            "<a href=\"#{dest_url}\">#{@text}</a>"
        end
    end
end

Liquid::Template::register_tag('local', Jekyll::LocalLink)
