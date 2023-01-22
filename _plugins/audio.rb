module Jekyll
    class AudioTag < Liquid::Tag
        def initialize(tag_name, filename, tokens)
            super
            parts = filename.split(' ')
            @filename = parts[0].strip
            @attributes = parts[1..-1].join(' ')
        end

        def render(context)
            audio_dir = "/audio"
            base_url = context.registers[:site].baseurl
            page_url = context.registers[:page].url
            src = "#{base_url}#{audio_dir}#{page_url}#{@filename}"
            "<audio controls><source src=\"#{src}\" #{@attributes}>Your browser does not support the audio tag.</audio>"
        end
    end
end

Liquid::Template::register_tag('audio', Jekyll::AudioTag)
