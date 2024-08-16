class ChatThread < ApplicationRecord
    has_many :prompts, dependent: :destroy

    def update_context(new_content)
        current_context = (self.context || "") + "\n" + new_content
        self.update(context: current_context.last(8000))
    end
end
