require 'pygments'

module Jekyll
  class PygmentsHighlight < Liquid::Block
    def initialize(tag_name, arg, options)
      super
      if arg
        @arg = arg.strip
      else
        @arg = nil
      end
    end

    def render(context)
      text = super
      if @arg
        Pygments.highlight(text, :lexer => @arg)
      else
        Pygments.highlight(text)
      end
    end

  end
end

Liquid::Template.register_tag('pygments', Jekyll::PygmentsHighlight)
