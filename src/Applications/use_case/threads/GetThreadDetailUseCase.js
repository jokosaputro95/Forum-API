class GetThreadDetailUseCase {
    constructor({ threadRepository, commentRepository, repliesRepository }) {
        this._threadRepository = threadRepository;
        this._commentRepository = commentRepository;
        this._repliesRepository = repliesRepository;
    }

    async execute(threadId) {
        const thread = await this._threadRepository.getThreadById(threadId);
        const rowComment = await this._commentRepository.commentsFromThread(threadId);
        const comments = await Promise.all(rowComment.map(async (val) => {
        const replies = await this._repliesRepository.repliesFromComment(val.id);
            return { ...val, replies };
        }));

        return { ...thread, comments };
    }
}

module.exports = GetThreadDetailUseCase;
