module Jekyll
    class ImageTag < Liquid::Tag
        def initialize(tag_name, filename, tokens)
            super
            parts = filename.split(' ')
            @filename = parts[0].strip
            @attributes = parts[1..-1].join(' ')
        end

        def render(context)
            image_dir = "/images"
            site_url = context.registers[:site].config['url']
            base_url = context.registers[:site].baseurl
            page_url = context.registers[:page].url
            src = "#{site_url}#{base_url}#{image_dir}#{page_url}#{@filename}"
            alt = File.basename(@filename, File.extname(@filename))
            "<img src=\"#{src}\" alt=\"#{alt}\" #{@attributes}>"
        end
    end
end

Liquid::Template::register_tag('image', Jekyll::ImageTag)
