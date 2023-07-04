const pool = require('../../../database/postgres/pool');
const AuthorizationError = require('../../../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../../../Commons/exceptions/NotFoundError');

const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const AddedComment = require('../../../../Domains/comments/entities/AddedComment');
const NewComment = require('../../../../Domains/comments/entities/NewComment');

const UsersTableTestHelper = require('../../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../../tests/CommentsTableTestHelper');

describe('CommentRepositoryPostgres', () => {
    const dummyUser = {
        id: 'user-123',
        username: 'dicoding',
    };

    const dummyUser2 = {
        id: 'user-xyz',
        username: 'jhon doe',
    };

    const dummyThread = {
        id: 'thread-123',
        owner: 'user-123',
    };

    beforeAll(async () => {
        await UsersTableTestHelper.addUser({ ...dummyUser });
        await UsersTableTestHelper.addUser({ ...dummyUser2 });
        await ThreadsTableTestHelper.addThread({ ...dummyThread });
    });

    afterEach(async () => {
        await CommentsTableTestHelper.cleanTable();
    });

    afterAll(async () => {
        await UsersTableTestHelper.cleanTable();
        await pool.end();
    });

    describe('addCommentToThread method', () => {
        it('should presist comment and return added comment correctly', async () => {
            // Arrange
            const newComment = new NewComment({ content: 'A comment' });
            const fakeIdGenerator = () => '123';

            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

            // Action
            await commentRepositoryPostgres
                .addCommentToThread(dummyThread.id, newComment, dummyUser.id);

            // Assert
            const comments = await CommentsTableTestHelper.findCommentById('comment-123');

            expect(comments).toHaveLength(1);
        });

        it('should return AddedComment correctly', async () => {
            // Arrange
            const newComment = new NewComment({ content: 'A comment' });
            const fakeIdGenerator = () => '123';

            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

            // Action
            const addedComment = await commentRepositoryPostgres
                .addCommentToThread(dummyThread.id, newComment, dummyUser.id);

            // Assert
            expect(addedComment).toStrictEqual(new AddedComment({
                id: 'comment-123',
                content: newComment.content,
                owner: dummyUser.id,
            }));
        });
    });

    describe('verifyCommentAccess method', () => {
        it('should throw NotFoundError if comment is not found', async () => {
            // Arrange
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

            // Action & Assert
            await expect(commentRepositoryPostgres.verifyCommentAccess('comment-123', dummyUser.id))
                .rejects.toThrowError(NotFoundError);
        });

        it('should throw AuthorizationError if user is not the comment owner', async () => {
            // Arrange
            const repo = new CommentRepositoryPostgres(pool, {});

            await CommentsTableTestHelper.addCommentToThread({ id: 'comment-123', owner: dummyUser.id });

            // Action & Assert
            await expect(repo.verifyCommentAccess('comment-123', dummyUser2.id))
                .rejects.toThrowError(AuthorizationError);
        });
    });

    describe('deleteCommentById method', () => {
        it('should call verifyCommentAccess method', async () => {
            // Arrange
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

            const spyVerifyCommentAccessMethod = jest.spyOn(commentRepositoryPostgres, 'verifyCommentAccess');

            await CommentsTableTestHelper.addCommentToThread({ id: 'comment-123', owner: dummyUser.id });

            // Action
            await commentRepositoryPostgres.deleteCommentById('comment-123', dummyUser.id);

            // Assert
            expect(spyVerifyCommentAccessMethod)
                .toBeCalledWith('comment-123', dummyUser.id);
        });

        it('should update the comment delete status', async () => {
            // Arrange
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

            await CommentsTableTestHelper.addCommentToThread({ id: 'comment-123', owner: dummyUser.id });

            // Action
            await commentRepositoryPostgres.deleteCommentById('comment-123', dummyUser.id);

            // Assert
            const [comment] = await CommentsTableTestHelper.findCommentById('comment-123');

            expect(comment.is_deleted).toEqual(true);
        });
    });

    describe('commentsFromThread method', () => {
        it('should return empty array if no comment are found', async () => {
            // Arrange
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

            // Action
            const comments = await commentRepositoryPostgres.commentsFromThread(dummyThread.id);

            // Assert
            expect(comments).toEqual([]);
        });

        it('should return array of comments with expected comment value', async () => {
            // Arrange
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

            await CommentsTableTestHelper.addCommentToThread({
                commentId: 'comment-123',
                content: 'A comment',
                owner: dummyUser.id,
            });

            // Action
            const [comment] = await commentRepositoryPostgres.commentsFromThread(dummyThread.id);

            // Assert
            expect(comment.id).toStrictEqual('comment-123');
            expect(comment.username).toStrictEqual(dummyUser.username);
            expect(comment.content).toStrictEqual('A comment');
            expect(comment.date.getDate()).toStrictEqual(new Date().getDate());
        });

        it('should return array of comments with custom content if comment is deleted', async () => {
            // Arrange
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

            await CommentsTableTestHelper.addCommentToThread({
                commentId: 'comment-123',
                content: 'A comment',
                owner: dummyUser.id,
            });

            await CommentsTableTestHelper.addCommentToThread({
                commentId: 'comment-xyz',
                content: 'A comment',
                owner: dummyUser2.id,
            });

            await CommentsTableTestHelper.deleteComment('comment-xyz');

            // Action
            const [comment, deletedComment] = await commentRepositoryPostgres
                .commentsFromThread(dummyThread.id);

            // Assert
            expect(comment.id).toStrictEqual('comment-123');
            expect(comment.username).toStrictEqual(dummyUser.username);
            expect(comment.content).toStrictEqual('A comment');
            expect(comment.date.getDate()).toStrictEqual(new Date().getDate());
            expect(comment.isDeleted).toEqual(false);

            expect(deletedComment.id).toStrictEqual('comment-xyz');
            expect(deletedComment.username).toStrictEqual(dummyUser2.username);
            expect(deletedComment.content).toStrictEqual('**komentar telah dihapus**');
            expect(deletedComment.date.getDate()).toStrictEqual(new Date().getDate());
            expect(deletedComment.isDeleted).toEqual(true);
        });
    });

    describe('verifyCommentLocation method', () => {
        // Arrange
        const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

        it('should throw NotFoundError if the comment is not found', async () => {
            // Action & Assert
            await expect(commentRepositoryPostgres.verifyCommentLocation('comment-123', dummyThread.id))
                .rejects.toThrowError(new NotFoundError('komentar tidak ditemukan'));
        });

        it('should throw NotFoundError if the comment is invalid', async () => {
            // Arrange
            await CommentsTableTestHelper.addCommentToThread({});

            // Action
            await expect(commentRepositoryPostgres.verifyCommentLocation('comment-123', 'thread-xyz'))
                .rejects.toThrowError(new NotFoundError('komentar tidak ditemukan pada thread ini'));
        });

        it('should not throw NotFoundError if the comment is valid', async () => {
            // Arrange
            await CommentsTableTestHelper.addCommentToThread({});

            // Action & Assert
            await expect(commentRepositoryPostgres.verifyCommentLocation('comment-123', dummyThread.id))
                .resolves.not.toThrowError(NotFoundError);
        });
    });
});
