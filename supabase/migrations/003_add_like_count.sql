-- posts 테이블에 like_count 컬럼 추가
ALTER TABLE posts 
ADD COLUMN like_count INTEGER DEFAULT 0;

-- 기존 좋아요 데이터를 기반으로 like_count 초기값 설정
UPDATE posts 
SET like_count = (
  SELECT COUNT(*) 
  FROM post_likes 
  WHERE post_likes.post_id = posts.id
);

-- like_count 인덱스 추가 (성능 향상)
CREATE INDEX idx_posts_like_count ON posts(like_count);

-- 좋아요 추가/삭제시 like_count 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET like_count = like_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET like_count = like_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- post_likes 테이블에 트리거 적용
CREATE TRIGGER update_like_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();